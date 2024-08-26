# GPTClone

GPTClone is a FastAPI-based chat application that uses langchain for conversation memory and OpenAI's language models to provide intelligent responses.

## Features

- FastAPI backend for efficient API handling
- Langchain integration for improved conversation memory
- OpenAI's GPT model for generating responses
- In-memory chat history storage
- Markdown formatting for better response presentation

## Prerequisites

- Python 3.7+
- OpenAI API key

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/marketcalls/gptclone.git
   cd gptclone
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root:
   ```
   cp .sample.env .env
   ```
   Then, edit the `.env` file and replace the placeholder values with your actual OpenAI API key and desired model:
   ```
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

## Usage

1. Start the FastAPI server:
   ```
   uvicorn app.main:app --reload
   ```

2. Open a web browser and navigate to `http://localhost:8000` to use the chat interface.

## Project Structure

- `app/`: Contains the main application code
  - `main.py`: FastAPI application and route definitions
  - `models.py`: Database models
  - `schemas.py`: Pydantic schemas for request/response validation
  - `database.py`: Database connection and session management
- `static/`: Static files (CSS, JavaScript)
- `templates/`: HTML templates
- `requirements.txt`: List of Python dependencies
- `.sample.env`: Sample environment file with placeholder values
- `.env`: (Created by you) Actual environment file with your API key and model name

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.