import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import errorHandler from './middleware/errorMiddleware.js';
import tenantMiddleware from './middleware/tenantMiddleware.js';

// Routes — Student Module
import authRoutes from './routes/authRoutes.js';
import instituteRoutes from './routes/instituteRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

// Routes — Teacher Module
import topicRoutes from './routes/topicRoutes.js';
import classRoutes from './routes/classRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import grievanceRoutes from './routes/grievanceRoutes.js';
import creatorStudioRoutes from './routes/creatorStudioRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';

// Swagger
import swaggerUi from 'swagger-ui-express';
import specs from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost origins (multi-tenant subdomains) and configured CLIENT_URL
      const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
      if (!origin || origin.includes('localhost') || origin === allowed) {
        callback(null, true);
      } else {
        callback(null, true); // relax in development; tighten for production
      }
    },
    credentials: true,
  })
);

// Standard Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Tenant detection (multi-tenant support from student module)
app.use(tenantMiddleware);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
const API = '/api/v1';

// Student module routes
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/institutes`, instituteRoutes);
app.use(`${API}/complaints`, complaintRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/activity-logs`, activityLogRoutes);
app.use(`${API}/academic`, academicRoutes);
app.use(`${API}/teachers`, teacherRoutes);
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/notices`, noticeRoutes);
app.use(`${API}/timetable`, timetableRoutes);
app.use(`${API}/fees`, feeRoutes);
app.use(`${API}/events`, eventRoutes);

// Teacher module routes
app.use(`${API}/topics`, topicRoutes);
app.use(`${API}/classes`, classRoutes);
app.use(`${API}/assignments`, assignmentRoutes);
app.use(`${API}/assessments`, assessmentRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/chat`, chatRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/subjects`, subjectRoutes);
app.use(`${API}/materials`, materialRoutes);
app.use(`${API}/grievances`, grievanceRoutes);
app.use(`${API}/creator-studio`, creatorStudioRoutes);

app.use(`${API}/attendance`, attendanceRoutes);

// Super Admin: onboard teachers/students + curriculum
app.use(`${API}/admin`, superAdminRoutes);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Root
app.get('/', (req, res) => {
  res.json({ message: 'School Platform API v1', docs: '/api/docs' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error Handler
app.use(errorHandler);

export default app;
