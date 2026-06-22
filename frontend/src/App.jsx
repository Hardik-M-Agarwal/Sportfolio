import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LandingPage from './pages/landing/LandingPage';

import OrganiserDashboard from './pages/organiser/OrganiserDashboard';
import TournamentsPage from './pages/organiser/TournamentsPage';
import TournamentDetailPage from './pages/organiser/TournamentDetailPage';

import CaptainDashboard from './pages/captain/CaptainDashboard';
import BrowseTournamentsPage from './pages/captain/BrowseTournamentsPage';
import MyTeamsPage from './pages/captain/MyTeamsPage';

import SponsorDashboard from './pages/sponsor/SponsorDashboard';
import SponsorBrowseTournamentsPage from './pages/sponsor/BrowseTournamentsPage';
import MySponsorshipsPage from './pages/sponsor/MySponsorshipsPage';

import ScorerDashboard from './pages/scorer/ScorerDashboard';
import ScoringPage from './pages/scorer/ScoringPage';
import PublicScorecard from './pages/public/PublicScorecard';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Organiser */}
        <Route path="/organiser/dashboard" element={
          <ProtectedRoute role="organiser"><OrganiserDashboard /></ProtectedRoute>
        } />
        <Route path="/organiser/tournaments" element={
          <ProtectedRoute role="organiser"><TournamentsPage /></ProtectedRoute>
        } />
        <Route path="/organiser/tournaments/:id" element={
          <ProtectedRoute role="organiser"><TournamentDetailPage /></ProtectedRoute>
        } />

        {/* Captain */}
        <Route path="/captain/dashboard" element={
          <ProtectedRoute role="captain"><CaptainDashboard /></ProtectedRoute>
        } />
        <Route path="/captain/tournaments" element={
          <ProtectedRoute role="captain"><BrowseTournamentsPage /></ProtectedRoute>
        } />
        <Route path="/captain/my-teams" element={
          <ProtectedRoute role="captain"><MyTeamsPage /></ProtectedRoute>
        } />

        {/* Sponsor */}
        <Route path="/sponsor/dashboard" element={
          <ProtectedRoute role="sponsor"><SponsorDashboard /></ProtectedRoute>
        } />
        <Route path="/sponsor/tournaments" element={
          <ProtectedRoute role="sponsor"><SponsorBrowseTournamentsPage /></ProtectedRoute>
        } />
        <Route path="/sponsor/my-sponsorships" element={
          <ProtectedRoute role="sponsor"><MySponsorshipsPage /></ProtectedRoute>
        } />

        {/* Scorer */}
        <Route path="/scorer/dashboard" element={
          <ProtectedRoute role="scorer"><ScorerDashboard /></ProtectedRoute>
        } />
        <Route path="/scorer/match/:matchId" element={
          <ProtectedRoute role="scorer"><ScoringPage /></ProtectedRoute>
        } />
        <Route path="/match/:matchId" element={<PublicScorecard />} />

      </Routes>
    </BrowserRouter>
  );
}