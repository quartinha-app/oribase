import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingView from './views/public/LandingView';
import LoginView from './views/auth/LoginView';
import RegisterView from './views/auth/RegisterView';
import ProfileSelectionView from './views/auth/ProfileSelectionView';
import SuccessView from './views/shared/SuccessView';
import DiagnosticDashboard from './views/dashboard/DiagnosticDashboard';
import AdminDashboard from './views/admin/AdminDashboard';
import AdminTerreiroTypes from './views/admin/AdminTerreiroTypes';
import TerreiroProfileView from './views/public/TerreiroProfileView';
import TerreiroListView from './views/public/TerreiroListView';
import AdminCampaignList from './views/admin/AdminCampaigns';
import AdminCampaignBuilder from './views/admin/AdminCampaignBuilder';
import LeaderDashboard from './views/dashboard/LeaderDashboard';
import SurveyRenderer from './views/survey/SurveyRenderer';
import NewsList from './views/admin/NewsList';
import ContentManager from './views/admin/ContentManager';
import TerreiroList from './views/admin/TerreiroList';
import PartnerList from './views/admin/PartnerList';
import UserList from './views/admin/UserList';
import AdminCampaignAnalytics from './views/admin/AdminCampaignAnalytics';
import RaffleManager from './views/admin/RaffleManager';
import ServiceCategories from './views/admin/ServiceCategories';
import ProfessionalList from './views/admin/ProfessionalList';
import CampaignResults from './views/admin/CampaignResults';
import UserSettings from './views/auth/UserSettings';
import LegalView from './views/public/LegalView';
import PublicCampaignsView from './views/public/PublicCampaignsView';
import ServiceSearch from './views/public/ServiceSearch';
import ProfessionalProfile from './views/professional/ProfessionalProfile';
import ProfessionalDashboard from './views/professional/ProfessionalDashboard';
import ProfessionalRegistration from './views/professional/ProfessionalRegistration';
import ServicesManager from './views/professional/ServicesManager';
import SubscriptionManager from './views/professional/SubscriptionManager';
import PublicCampaignResults from './views/public/PublicCampaignResults';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import ProfessionalRoute from './components/auth/ProfessionalRoute';
import LeaderRoute from './components/auth/LeaderRoute';
import CookieBanner from './components/ui/CookieBanner';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/select-profile" element={<ProfileSelectionView />} />
          <Route path="/pesquisa/:slug" element={<SurveyRenderer />} />
          <Route path="/survey/:slug" element={<SurveyRenderer />} />
          <Route path="/legal" element={<LegalView />} />
          <Route path="/resultados" element={<CampaignResults />} />
          <Route path="/pesquisas/:slug/resultados" element={<PublicCampaignResults />} />
          <Route path="/pesquisas" element={<PublicCampaignsView />} />
          <Route path="/terreiros" element={<TerreiroListView />} />
          <Route path="/terreiro/:slug" element={<TerreiroProfileView />} />
          <Route path="/servicos" element={<ServiceSearch />} />
          <Route path="/servicos/:id" element={<ProfessionalProfile />} />


          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DiagnosticDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader-dashboard"
            element={
              <LeaderRoute>
                <LeaderDashboard />
              </LeaderRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/campaigns"
            element={
              <AdminRoute>
                <AdminCampaignList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/campaigns/new"
            element={
              <AdminRoute>
                <AdminCampaignBuilder />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/campaigns/:id"
            element={
              <AdminRoute>
                <AdminCampaignBuilder />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <AdminRoute>
                <NewsList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/partners"
            element={
              <AdminRoute>
                <PartnerList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <AdminRoute>
                <ContentManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/terreiros"
            element={
              <AdminRoute>
                <TerreiroList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/professionals"
            element={
              <AdminRoute>
                <ProfessionalList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <ServiceCategories />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/campaigns/:id/analytics"
            element={
              <AdminRoute>
                <AdminCampaignAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/campaigns/:id/raffle"
            element={
              <AdminRoute>
                <RaffleManager />
              </AdminRoute>
            }
          />

          <Route
            path="/ajustes"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />

          {/* Professional Routes */}
          <Route
            path="/area-profissional"
            element={
              <ProfessionalRoute>
                <ProfessionalDashboard />
              </ProfessionalRoute>
            }
          />
          <Route
            path="/cadastro-profissional"
            element={
              <ProfessionalRoute>
                <ProfessionalRegistration />
              </ProfessionalRoute>
            }
          />
          <Route
            path="/meus-servicos"
            element={
              <ProfessionalRoute>
                <ServicesManager />
              </ProfessionalRoute>
            }
          />
          <Route
            path="/assinatura"
            element={
              <ProfessionalRoute>
                <SubscriptionManager />
              </ProfessionalRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route
            path="/admin/terreiro-types"
            element={
              <AdminRoute>
                <AdminTerreiroTypes />
              </AdminRoute>
            }
          />
        </Routes>
        <CookieBanner />
      </AuthProvider>
    </Router>
  );
}

export default App;
