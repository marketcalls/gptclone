from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from . import models, schemas, database
from dotenv import load_dotenv
import os
import logging
from fastapi.responses import StreamingResponse
import markdown
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Initialize the language model
model = ChatOpenAI(model="gpt-4o-mini", openai_api_key=os.getenv("OPENAI_API_KEY"))

# Create tables
database.create_tables()

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create a prompt template for the chatbot
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. Format your response using markdown for better presentation. Use # for main headings, ## for subheadings, * for bullet points, and other markdown syntax as needed."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

# Combine the model with the prompt
chain = prompt | model

# Store for chat histories
chat_histories = {}

# Function to get session history
def get_session_history(session_id: str):
    if session_id not in chat_histories:
        chat_histories[session_id] = InMemoryChatMessageHistory()
    return chat_histories[session_id]

# Combine the chain with message history
with_message_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="chat_history",
    history_messages_key="chat_history"
)

@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/chat")
async def chat(chat_input: schemas.ChatInput, db: Session = Depends(get_db)):
    try:
        session_id = "default"  # You might want to implement session management

        # Save the user's input to the database
        user_message = models.Message(content=chat_input.message, is_user=True)
        db.add(user_message)
        db.commit()

        # Function to stream the response
        def generate():
            full_response = ""
            for chunk in with_message_history.stream(
                {"input": chat_input.message},
                config={"configurable": {"session_id": session_id}}
            ):
                content = chunk.content
                full_response += content
                yield content

            # Convert markdown to HTML
            html_content = markdown.markdown(full_response)
            
            # Save the AI response to the database
            ai_message = models.Message(content=html_content, is_user=False)
            db.add(ai_message)
            db.commit()

        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request")

@app.get("/history")
async def get_history(db: Session = Depends(get_db)):
    messages = db.query(models.Message).order_by(models.Message.timestamp).all()
    return [{"content": msg.content, "is_user": msg.is_user} for msg in messages]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)