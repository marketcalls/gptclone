document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // Load chat history
    fetch('/history')
        .then(response => response.json())
        .then(messages => {
            chatMessages.innerHTML = ''; // Clear existing messages
            messages.forEach(message => {
                addMessageToChat(message.content, message.is_user);
            });
        })
        .catch(error => console.error('Error loading chat history:', error));

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            addMessageToChat(message, true);
            userInput.value = '';

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: message }),
                });

                if (response.ok) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let aiResponse = '';
                    const aiMessageElement = addMessageToChat('', false);

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value);
                        aiResponse += chunk;
                        aiMessageElement.querySelector('.chat-bubble').innerHTML = markdownToHtml(aiResponse);
                    }
                } else {
                    console.error('Error:', response.statusText);
                    addMessageToChat('Sorry, an error occurred. Please try again.', false);
                }
            } catch (error) {
                console.error('Error:', error);
                addMessageToChat('Sorry, an error occurred. Please try again.', false);
            }
        }
    });

    function addMessageToChat(message, isUser) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat', isUser ? 'chat-end' : 'chat-start');
        messageElement.innerHTML = `
            <div class="chat-bubble ${isUser ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
                ${isUser ? message : markdownToHtml(message)}
            </div>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    }

    function markdownToHtml(markdown) {
        // Handle tables
        markdown = markdown.replace(/\|(.+)\|/g, function(match, tableContent) {
            const rows = tableContent.trim().split('\n').filter(row => row.trim() !== '');
            let tableHtml = '<div class="overflow-x-auto"><table class="table table-zebra">';
            
            rows.forEach((row, index) => {
                const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                const isHeader = index === 0;
                
                if (isHeader) {
                    tableHtml += '<thead><tr>';
                    cells.forEach(cell => {
                        tableHtml += `<th>${cell}</th>`;
                    });
                    tableHtml += '</tr></thead><tbody>';
                } else {
                    tableHtml += '<tr>';
                    cells.forEach((cell, cellIndex) => {
                        tableHtml += cellIndex === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`;
                    });
                    tableHtml += '</tr>';
                }
            });
            
            tableHtml += '</tbody></table></div>';
            return tableHtml;
        });

        // Handle code blocks
        markdown = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, language, code) {
            return `<pre><code class="language-${language || ''}">${code.trim()}</code></pre>`;
        });

        // Handle inline code
        markdown = markdown.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Handle other markdown elements
        return markdown
            .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-4">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\* (.*$)/gm, '<ul class="list-disc list-inside"><li>$1</li></ul>')
            .replace(/^\d+\. (.*$)/gm, '<ol class="list-decimal list-inside"><li>$1</li></ol>')
            .replace(/\n/g, '<br>');
    }
});