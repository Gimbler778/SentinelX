
# SentinelX - Security & Monitoring Tool

A comprehensive security monitoring platform with real-time log analysis, vulnerability scanning, and performance monitoring.

##  Quick Start

```bash
# Clone the project
git clone <your-repo>
cd sentinelx-project

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

##  Tech Stack

### Frontend
- React 18
- TailwindCSS + shadcn/ui
- Framer Motion (animations)
- Recharts (visualizations)
- Vite (bundler)
- WebSockets (real-time updates)

### Backend
- Node.js + Express
- PostgreSQL (Neon)
- RabbitMQ (message queue)
- Prometheus (metrics)
- JWT authentication

### Infrastructure
- Docker & Docker Compose
- Grafana Cloud (monitoring)
- OpenVAS (vulnerability scanning)
- Oracle Cloud (deployment)

##  Project Structure

```
sentinelx-project/
├── backend/              # Node.js Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Business logic
│   │   ├── services/    # Service layer
│   │   ├── models/      # Database models
│   │   ├── middleware/  # Express middleware
│   │   └── config/      # Configuration
│   ├── tests/           # Test files
│   ├── migrations/      # Database migrations
│   ├── Dockerfile       # Container config
│   └── package.json
│
├── frontend/            # React application
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   ├── context/     # React context
│   │   └── styles/      # Global styles
│   ├── Dockerfile       # Container config
│   └── package.json
│
├── infrastructure/      # DevOps configs
│   ├── docker/          # Docker configs
│   ├── kubernetes/      # K8s manifests
│   ├── monitoring/      # Prometheus config
│   └── scripts/         # Automation scripts
│
├── docs/                # Documentation
│   ├── setup/           # Setup guides
│   ├── api/             # API documentation
│   └── deployment/      # Deployment guides
│
├── docker-compose.yml   # Local development setup
├── THIRD_PARTY_SETUP.md # External services guide
└── README.md
```

##  Configuration

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:pass@host/sentinelx
RABBITMQ_URL=amqp://user:pass@host/vhost
PORT=3000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_ENV=development
```

##  Available Scripts

### Backend
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm start           # Start production server
npm test            # Run tests
npm run migrate     # Run database migrations
```

### Frontend
```bash
npm install         # Install dependencies
npm run dev        # Start dev server (Vite)
npm run build      # Build for production
npm run preview    # Preview production build
```

### Docker
```bash
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs       # View logs
docker-compose ps        # View running services
```

##  Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend API | http://localhost:3000/api | JWT token |
| Prometheus | http://localhost:9090 | - |
| RabbitMQ | http://localhost:15672 | guest/guest |
| PostgreSQL | localhost:5432 | admin/password |

##  Documentation

- [Setup Guide](./docs/setup/SETUP_GUIDE.md)
- [Third-Party Services](./THIRD_PARTY_SETUP.md)
- [API Documentation](./docs/api/README.md)
- [Deployment Guide](./docs/deployment/README.md)

##  Free Platforms Used

✅ **Neon PostgreSQL** - 0.5GB free storage  
✅ **RabbitMQ Cloud** - 1M messages/month free  
✅ **Grafana Cloud** - 3GB metrics free  
✅ **Oracle Cloud** - Always free tier  
✅ **Docker** - Free containerization  
✅ **OpenVAS** - Free vulnerability scanner  

*No credit card required for any service!*

##  Deployment

### Quick Deploy to Oracle Cloud

See [THIRD_PARTY_SETUP.md](./THIRD_PARTY_SETUP.md#4️⃣-oracle-cloud-always-free---best) for detailed instructions.

### Docker Deployment

```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d

# View status
docker-compose ps
```

##  Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

##  License

MIT License - feel free to use for personal and commercial projects.

##  Support

For issues and questions:
1. Check the documentation
2. Review THIRD_PARTY_SETUP.md
3. Check docker-compose logs

---

**Happy monitoring! **
