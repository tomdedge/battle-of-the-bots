# AuraFlow

A Mindful Flow Assistant designed to help individuals maintain consistent focus and build positive digital habits.

## Getting Started

### Database Setup
```bash
./setup-db.sh
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Database Admin (Optional)
```bash
npm run start:db-admin
```

## Access Points
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **Adminer**: http://localhost:5051 (Database admin)
- **PostgREST API**: http://localhost:3001

## Features (MVP)
- ✅ Custom AuraFlow theme with warm, mindful colors
- ✅ Dark/light mode toggle
- ✅ Mobile-first responsive design
- ✅ Bottom tab navigation
- ✅ Placeholder components for all sections
- ✅ Database admin interface

## Next Steps
- [ ] Google OAuth authentication
- [ ] AI chat interface with Socket.io
- [ ] Calendar integration with Google Calendar API
- [ ] Box breathing meditation interface
