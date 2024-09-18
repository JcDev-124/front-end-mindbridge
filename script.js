tinymce.init({ 
    selector: 'textarea',
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
});

const url = 'http://localhost:8081/question/send';

async function sendQuestion() {
    const text = tinymce.get('questao').getContent();
    const image = document.querySelector("#imagem").value; // Presumindo que seja um input de arquivo ou similar
    const resposta = document.querySelector("#resposta-ia");

    const body = {
        message: text,
        imageBase64: image
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    
        if (!response.ok) {
            throw new Error('Erro na requisição: ' + response.statusText);
        }

        // Obtém a resposta como texto
        const textResponse = await response.text();

        tinymce.get('resposta-ia').setContent(textResponse);

        console.log(textResponse); // Para depuração
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

const botaoEnviar = document.querySelector("#enviar");
botaoEnviar.addEventListener("click", sendQuestion);
