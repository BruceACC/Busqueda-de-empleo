const axios = require('axios');

// Configuramos el modelo de Ollama que mencionaste
const OLLAMA_MODEL = 'gemma4:e4b'; 
const OLLAMA_URL = 'http://localhost:11434/api/generate';

/**
 * Envía el texto de la vacante a Ollama y pide extraer los datos en formato JSON.
 */
async function analyzeJobDescriptionWithAI(text) {
  const prompt = `
Eres un asistente experto en Recursos Humanos especializado en el sector TI.
Tu tarea es leer la siguiente descripción de una oferta de empleo y extraer información precisa.
Debes responder ESTRICTAMENTE con un objeto JSON válido, sin texto adicional antes ni después, y sin bloques de código markdown como \`\`\`json.
Las claves del JSON deben ser exactamente estas:
{
  "skills": ["Habilidad1", "Habilidad2"],
  "experience": "Texto corto indicando años o si es sin experiencia",
  "area": "El área principal de TI (ej: Desarrollo Backend, Frontend, Datos, QA, etc)",
  "salary": "Texto corto con el salario o 'No especificado'",
  "seniority": "Una de estas opciones: Practicante, Trainee, Junior, Semi-Senior, Senior, Gerente / Lead, o No especificado",
  "seniorityLevel": "Número entero: 0 para Practicante, 1 para Trainee, 2 para Junior, 3 para Semi-Senior, 4 para Senior, 5 para Gerente. Si no se especifica, -1"
}

Descripción de la oferta:
"""
${text}
"""
`;

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1 // Temperatura baja para mayor consistencia
      }
    });

    const aiResponseText = response.data.response;
    
    // Intentar parsear el JSON de la respuesta
    try {
      // Limpiar posibles bloques markdown
      let cleanJson = aiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      return parsedData;
    } catch (parseError) {
      console.error('[Ollama] Error parseando JSON:', aiResponseText);
      return null;
    }
  } catch (error) {
    console.error('[Ollama] Error comunicándose con Ollama:', error.message);
    return null;
  }
}

module.exports = {
  analyzeJobDescriptionWithAI
};
