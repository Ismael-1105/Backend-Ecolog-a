
const app = require('./app');
const dotenv = require('dotenv');
const Joi = require('joi');
const connectDB = require('./src/config/db');

dotenv.config();

// Validate environment variables
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(8080),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRE: Joi.string().default('30d'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(5),
  MAX_FILE_SIZE: Joi.number().default(524288000),
  CORS_ORIGIN: Joi.string().required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required()
}).unknown();

const { error } = envSchema.validate(process.env);
if (error) {
  console.error('Environment variable validation error:', error.details[0].message);
  process.exit(1);
}

connectDB();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});