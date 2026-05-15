import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Platform API',
      version: '1.0.0',
      description: 'Unified API documentation for School Platform (student + teacher modules)',
    },
    servers: [{ url: 'http://localhost:5000/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);
export default specs;
