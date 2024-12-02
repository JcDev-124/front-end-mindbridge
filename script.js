// Constantes
const LOGIN_URL = 'http://localhost:8081/auth/login';
const QUESTION_URL = 'http://localhost:8082/question';
let authToken = '';

// Função de login
async function login(event) {
    event.preventDefault(); // Evita o redirecionamento padrão

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ login: email, password: password })
        });

        if (!response.ok) {
            throw new Error('Erro na autenticação: ' + response.statusText);
        }

        const data = await response.json();
        authToken = data.token; // Armazena o token recebido
        localStorage.setItem('authToken', authToken); // Armazena no localStorage
        window.location.href = "dash.html";

    } catch (error) {
        console.error('Erro:', error);
        alert('Falha no login: ' + error.message);
    }
}

// Inicializa o TinyMCE
tinymce.init({ 
    selector: 'textarea',
    plugins: 'lists',
    toolbar: 'undo redo | formatselect | bold italic underline | removeformat',
});

// Função para capturar o conteúdo da questão
function getQuestionContent() {
    return tinymce.get('questao').getContent({ format: 'text' });
}

// Função para capturar a imagem selecionada e convertê-la para base64
function getImageContent() {
    return new Promise((resolve, reject) => {
        const fileInput = document.querySelector("#imagem");
        const file = fileInput.files[0];

        if (!file) {
            resolve(null);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result.split(',')[1]); // Remove a parte do prefixo da string base64
        };
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

// Função para capturar a opção selecionada
function getSelectedOption() {
    const options = document.getElementsByName('opcao');
    for (let option of options) {
        if (option.checked) {
            return option.value;
        }
    }
    return null;
}

// Função para capturar palavras em negrito
function getBoldWords() {
    const boldContent = tinymce.get('questao').getContent();
    const parser = new DOMParser();
    const doc = parser.parseFromString(boldContent, 'text/html');
    const boldElements = doc.querySelectorAll('strong');
    const boldWordsArray = Array.from(boldElements).map(el => el.textContent);
    return boldWordsArray.join(', ');
}

// Função para construir o corpo da requisição
function buildRequestBody(text, image, selectedOption, boldWords) {
    return {
        message: text,
        imageBase64: image,
        neurodiversityOption: selectedOption,
        importantWords: boldWords
    };
}

// Função para enviar a questão
async function sendQuestion() {
    authToken = localStorage.getItem('authToken'); // Recupera o token do localStorage
    if (!authToken) {
        alert('Você precisa fazer login primeiro.');
        window.location.href = "index.html";
        return; // Para garantir que a função não continue se o token não estiver presente
    }

    console.log('Token antes de enviar a questão:', authToken); // Debug

    const text = getQuestionContent();
    const image = await getImageContent();
    const selectedOption = getSelectedOption();
    const boldWords = getBoldWords();

    const body = buildRequestBody(text, image, selectedOption, boldWords);

    try {
        const response = await fetch(QUESTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // Insere o token no cabeçalho
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            if (response.status === 403) {
                window.location.href = 'index.html';
            } else {
                throw new Error('Erro na requisição: ' + response.statusText);
            }
        }

        // A resposta será um JSON, então você precisa transformá-la em objeto
        const jsonResponse = await response.json();

        // Acessar o conteúdo da resposta
        const textResponse = jsonResponse.choices[0].message.content;

        // Exibir o conteúdo no editor TinyMCE
        tinymce.get('resposta-ia').setContent(textResponse);

    } catch (error) {
        console.error('Erro:', error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const enviarButton = document.querySelector("#enviar");
    
    if (enviarButton) {
        enviarButton.addEventListener("click", sendQuestion);
    } else {
        console.error("Elemento com ID 'enviar' não encontrado.");
    }
});
