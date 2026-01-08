import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "API de Ejemplo",
    description: "Documentación generada automáticamente con swagger-autogen",
  },
  host: "localhost:8080",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"]; // Archivos donde tienes tus rutas

swaggerAutogen()(outputFile, endpointsFiles, doc);
