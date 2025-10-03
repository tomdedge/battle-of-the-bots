# AuraFlow Development Pivot Plan

## 🎯 Refocused Priorities

Based on the actual product specification, we're pivoting from generic productivity features to the core AuraFlow vision: **ritual-based focus sessions with gentle, compassionate guidance**.

## 📋 Current State Assessment

### ✅ What We Have (Strong Foundation)
- **Authentication & Security**: Google OAuth, JWT, protected routes
- **Calendar Integration**: Google Calendar API, event retrieval, gap analysis
- **Task Management**: Google Tasks API, CRUD operations
- **AI Chat Interface**: LLM integration, real-time chat, MCP tools
- **Basic Mindfulness**: Box breathing exercise, visual guidance
- **UI/UX Foundation**: Mantine components, responsive design, PWA setup

### ❌ What We're Missing (Core Product Vision)
- **Focus Session Management**: No actual session execution
- **Ritual Templates Library**: No pre-designed focus rituals
- **Gentle Nudge System**: No compassionate notification system
- **Ambient Soundscape Engine**: No environmental audio support

## 🚀 Phase 1: Core Focus Experience (Next 2-3 weeks)

### 1. Focus Session Management
**Goal**: Transform calendar blocks into executable focus sessions

**Implementation**:
- Add session timer component with start/pause/stop
- Integrate with existing calendar blocks
- Session state management (active, paused, completed)
- Basic progress tracking and completion celebration
- Simple session history storage

**User Story**: "I can click on a calendar focus block and actually start a timed session"

### 2. Ritual Templates Library  
**Goal**: Provide pre-designed focus rituals that users can customize

**Implementation**:
- Create ritual template data structure
- Build 3-5 starter templates:
  - **Deep Work Ritual**: 90min focus + breathing prep + reflection
  - **Creative Sprint**: 45min focus + energizing break + capture
  - **Admin Power Hour**: 60min focus + quick wins + cleanup
  - **Morning Momentum**: 25min focus + gratitude + planning
  - **Afternoon Reset**: 30min focus + movement + prioritization
- Ritual selection and customization UI
- Template execution workflow

**User Story**: "I can choose a 'Deep Work Ritual' and it guides me through prep, focus time, and reflection"

### 3. Gentle Nudge System
**Goal**: Compassionate, non-intrusive guidance throughout sessions

**Implementation**:
- Browser notification system with permission handling
- Gentle transition messages ("Time for a mindful pause...")
- Positive reinforcement ("You're doing great, 15 minutes left")
- Break reminders with suggested activities
- Session completion celebrations
- Compassionate language patterns (no guilt/shame)

**User Story**: "The app gently reminds me to take breaks and celebrates my progress without making me feel bad"

## 🎵 Phase 2: Environmental Support (Weeks 3-4)

### 4. Basic Ambient Soundscape Engine
**Goal**: Provide environmental audio to support focus sessions

**Implementation**:
- 5-6 high-quality ambient tracks:
  - Forest sounds (birds, rustling leaves)
  - Rain/thunderstorm
  - Ocean waves
  - White noise
  - Coffee shop ambiance
  - Silence (for those who prefer quiet)
- Simple audio player with volume control
- Sound selection tied to ritual templates
- Audio preferences storage

**User Story**: "I can start a focus session with forest sounds that automatically play during my ritual"

## 🧠 Phase 3: AI Enhancement (Weeks 4-6)

### 5. Smart Ritual Suggestions
**Goal**: Leverage existing AI to provide contextual ritual recommendations

**Implementation**:
- Analyze calendar context to suggest appropriate rituals
- Learn from user ritual choices and session outcomes
- Provide gentle suggestions: "You have a creative meeting next - want to try a Creative Sprint ritual first?"
- Adapt ritual timing based on available calendar slots
- Simple pattern recognition for optimal session timing

**User Story**: "The AI suggests a 'Morning Momentum' ritual when I have a busy day ahead"

## 📊 Success Metrics

### Phase 1 Success Criteria
- [ ] Users can execute complete focus sessions from calendar blocks
- [ ] 5 ritual templates available and functional
- [ ] Gentle notifications working without being annoying
- [ ] Session completion rate > 70%

### Phase 2 Success Criteria  
- [ ] Ambient sounds enhance focus session experience
- [ ] Users can customize sound preferences per ritual
- [ ] Audio doesn't interfere with other system sounds

### Phase 3 Success Criteria
- [ ] AI provides relevant ritual suggestions
- [ ] Suggestions improve over time based on user behavior
- [ ] Users accept AI suggestions > 40% of the time

## 🛠 Technical Implementation Strategy

### Leverage Existing Infrastructure
- **Use current calendar integration** for session scheduling
- **Extend existing task management** for session-related tasks
- **Build on current AI chat** for ritual suggestions and guidance
- **Enhance current mindfulness features** as ritual components

### New Components Needed
- **Session Timer Component**: React component with start/pause/stop
- **Ritual Template Engine**: Data structure + execution logic
- **Notification Service**: Browser notifications with gentle messaging
- **Audio Player Component**: Simple ambient sound player
- **Session History Service**: Track completed sessions and outcomes

### Database Extensions
```sql
-- Ritual templates
CREATE TABLE ritual_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  duration_minutes INTEGER,
  components JSONB, -- prep, focus, breaks, reflection
  default_soundscape VARCHAR(100)
);

-- User sessions
CREATE TABLE focus_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  ritual_template_id INTEGER REFERENCES ritual_templates(id),
  calendar_event_id VARCHAR(255),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_minutes INTEGER,
  interruptions INTEGER DEFAULT 0,
  satisfaction_rating INTEGER, -- 1-5 optional
  notes TEXT
);
```

## 🎨 UI/UX Considerations

### Design Principles (from spec)
- **Guilt-free design philosophy**: No shame, only encouragement
- **Minimalist focus mode**: Clean, distraction-free interface
- **Compassionate messaging**: Gentle, supportive language
- **Beautiful progress visualization**: Celebrate achievements

### Key UI Components
- **Session Timer**: Large, calming countdown with progress ring
- **Ritual Selector**: Card-based template selection with previews
- **Gentle Notifications**: Soft, non-intrusive message overlays
- **Soundscape Controls**: Simple volume and track selection
- **Completion Celebrations**: Positive reinforcement without gamification

## 🚧 Implementation Order

### Week 1: Foundation
1. Session timer component
2. Basic session state management
3. Integration with calendar blocks

### Week 2: Rituals
1. Ritual template data structure
2. Template selection UI
3. Ritual execution workflow
4. 3 starter ritual templates

### Week 3: Guidance
1. Notification permission handling
2. Gentle nudge messaging system
3. Break reminders and transitions
4. Completion celebrations

### Week 4: Audio
1. Ambient sound file preparation
2. Audio player component
3. Sound selection integration
4. Volume and preference controls

### Week 5-6: AI Enhancement
1. Calendar context analysis
2. Ritual suggestion logic
3. Simple pattern recognition
4. Adaptive recommendations

## 🤔 Key Questions to Resolve

1. **Audio Sourcing**: Should we create/license ambient sounds or use existing libraries?
2. **Notification Strategy**: Browser notifications vs. in-app gentle nudges vs. both?
3. **Ritual Customization**: How much should users be able to modify templates initially?
4. **Session Interruption Handling**: How do we gracefully handle interruptions during sessions?
5. **Data Privacy**: What session data do we store vs. keep local?

## 🎯 Success Definition

**By end of Phase 1**: Users can select a ritual template, execute a complete focus session with gentle guidance, and feel supported rather than pressured.

**By end of Phase 2**: The focus experience feels immersive and environmentally supportive.

**By end of Phase 3**: The AI feels like a helpful, learning companion rather than just a chatbot.

This pivot aligns us with the actual product vision: creating a **mindful, ritual-based focus assistant** that helps users build sustainable productivity habits through compassionate design.
