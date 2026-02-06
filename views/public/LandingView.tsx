import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Terreiro, TerreiroType } from '../../types';
import { IMAGES } from '../../constants';
import MainLayout from '../../layouts/MainLayout';
import { getPublicContent, getPublicPartners, getPublicTeam, getPublicFAQs } from '../../services/content';
import { Partner, SiteContent, Profile, FAQ } from '../../types';
import { getLandingPageCampaigns, LandingPageCampaigns } from '../../services/campaign';
import NewsCarousel from '../../components/ui/NewsCarousel';
import { Instagram, Facebook, Linkedin, Youtube, MessageCircle } from 'lucide-react';
import { getFeaturedProfessionals, Professional, ServiceCategory } from '../../services/professional';
import { useMap } from 'react-leaflet';

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 500);
  }, [map]);
  return null;
};

const ProfessionalsListPreview: React.FC = () => {
  const [professionals, setProfessionals] = useState<(Professional & { category: ServiceCategory })[]>([]);

  useEffect(() => {
    getFeaturedProfessionals().then(setProfessionals).catch(console.error);
  }, []);

  if (professionals.length === 0) return (
    <div className="bg-white rounded-[32px] p-12 text-center border border-dashed border-gray-200">
      <span className="material-symbols-outlined text-4xl text-gray-300 mb-4">engineering</span>
      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">A rede está crescendo! Em breve novos profissionais.</p>
      <Link to="/servicos" className="inline-block mt-6 text-primary font-black uppercase text-xs tracking-widest border-b border-primary/20 hover:border-primary">Cadastre-se como profissional</Link>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {professionals.map(pro => (
        <Link key={pro.id} to={`/servicos/${pro.id}`} className="group bg-white rounded-[24px] p-6 border border-gray-100 hover:border-primary/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-14 rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 group-hover:border-primary/20 transition-colors">
              {pro.photo_url ? (
                <img src={pro.photo_url} className="w-full h-full object-cover" alt={pro.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-text-main truncate group-hover:text-primary transition-colors">{pro.name}</h3>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg inline-block mt-1">
                {pro.category?.name}
              </span>
            </div>
          </div>
          {pro.bio && (
            <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-4 h-8">{pro.bio}</p>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <div className="flex items-center gap-1 text-amber-400">
              <span className="material-symbols-outlined text-sm">star</span>
              <span className="text-xs font-black text-gray-700">{pro.rating_average > 0 ? pro.rating_average : 'Novato'}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {pro.city}/{pro.state}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const TerreiroDiscoverMap: React.FC = () => {
  const [terreiros, setTerreiros] = useState<Terreiro[]>([]);
  const [types, setTypes] = useState<TerreiroType[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from('terreiros').select('*, type:terreiro_types(*)').eq('verification_status', 'verified').eq('is_visible', true);
      if (filterType) query = query.eq('type_id', filterType);
      if (filterState) query = query.eq('state', filterState);

      const [tRes, tyRes] = await Promise.all([
        query,
        supabase.from('terreiro_types').select('*').eq('active', true).order('name')
      ]);
      if (tRes.data) setTerreiros(tRes.data as Terreiro[]);
      if (tyRes.data) setTypes(tyRes.data);
    };
    fetchData();
  }, [filterType, filterState]);

  const createCustomIcon = (imageUrl: string) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
                <div class="relative group">
                    <div class="size-12 bg-primary p-0.5 rounded-full shadow-[0_0_15px_rgba(220,115,60,0.4)] group-hover:scale-110 transition-transform duration-300">
                        <div class="w-full h-full bg-white rounded-full overflow-hidden flex items-center justify-center border-2 border-white">
                            <img src="${imageUrl || '/favicon_oribase.png'}" class="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rotate-45 -z-10 shadow-lg"></div>
                </div>
            `,
      iconSize: [48, 48],
      iconAnchor: [24, 52]
    });
  };

  return (
    <div className="relative h-[600px] rounded-[50px] overflow-hidden shadow-2xl border-8 border-white group">
      <MapContainer center={[-14.235, -51.925]} zoom={4} className="w-full h-full">
        <MapResizer />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {terreiros.map(t => (
          <Marker key={t.id} position={[t.latitude || 0, t.longitude || 0]} icon={createCustomIcon(t.image || '')}>
            <Popup className="custom-popup">
              <div className="p-2 space-y-3 min-w-[200px]">
                <h4 className="font-black text-text-main uppercase tracking-tight text-sm">{t.name}</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">{t.city} • {t.state}</p>
                <Link
                  to={t.slug ? `/terreiro/${t.slug}` : `/terreiro/${t.id}`}
                  className="w-full py-2.5 bg-primary !text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center shadow-md shadow-primary/20"
                >
                  Visitar Perfil
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Float Filters */}
      <div className="absolute top-6 left-6 right-6 z-[10] flex flex-wrap gap-3">
        <select
          className="h-12 px-4 rounded-xl bg-white/90 backdrop-blur-md shadow-xl border-none text-xs font-black uppercase tracking-widest text-text-main focus:ring-primary appearance-none cursor-pointer"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Todos os Tipos</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          className="h-12 px-4 rounded-xl bg-white/90 backdrop-blur-md shadow-xl border-none text-xs font-black uppercase tracking-widest text-text-main focus:ring-primary appearance-none cursor-pointer"
          value={filterState}
          onChange={e => setFilterState(e.target.value)}
        >
          <option value="">Brasil Inteiro</option>
          {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
        <Link to="/terreiros" className="ml-auto h-12 px-6 rounded-xl bg-secondary text-white shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
          <span className="material-symbols-outlined text-sm">list</span> Ver em Lista
        </Link>
      </div>
    </div>
  );
};

const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [campaignData, setCampaignData] = useState<LandingPageCampaigns & { totalCount: number }>({
    inProgress: null,
    finished: null,
    upcoming: null,
    totalCount: 0
  });

  const [aboutContent, setAboutContent] = useState<SiteContent[]>([]);
  const [contactContent, setContactContent] = useState<SiteContent[]>([]);
  const [socialContent, setSocialContent] = useState<SiteContent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [team, setTeam] = useState<Profile[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    getLandingPageCampaigns().then(setCampaignData).catch(console.error);
    getPublicContent('about').then(setAboutContent).catch(console.error);
    getPublicContent('contact').then(setContactContent).catch(console.error);
    getPublicContent('social').then(setSocialContent).catch(console.error);
    getPublicPartners().then(setPartners).catch(console.error);
    getPublicTeam().then(setTeam).catch(console.error);
    getPublicFAQs('supporter_rules').then(setFaqs).catch(console.error);
  }, []);

  const { inProgress, finished, upcoming, totalCount } = campaignData;
  const aboutTitle = aboutContent.find(c => c.key === 'title')?.content || 'O que é o OríBase?';
  const aboutText = aboutContent.find(c => c.key === 'content')?.content || 'Carregando...';
  const aboutImage = aboutContent.find(c => c.key === 'image_url')?.content;
  const contactEmail = contactContent.find(c => c.key === 'email')?.content || 'contato@oribase.org.br';
  const contactPhone = contactContent.find(c => c.key === 'phone')?.content || '(00) 00000-0000';

  const socialLinks = {
    instagram: socialContent.find(c => c.key === 'instagram')?.content,
    facebook: socialContent.find(c => c.key === 'facebook')?.content,
    linkedin: socialContent.find(c => c.key === 'linkedin')?.content,
    youtube: socialContent.find(c => c.key === 'youtube')?.content,
    whatsapp: socialContent.find(c => c.key === 'whatsapp')?.content,
  };

  const navbarLinks = [
    { label: 'Mapa', href: '#mapa' },
    { label: 'Sobre', href: '#sobre' },
    { label: 'Time', href: '#time' },
    { label: 'Parceiros', href: '#parceiros' },
    { label: 'Dúvidas', href: '#faq' },
    { label: 'Contato', href: '#contato' },
  ];

  const actionButtons = user ? (
    <Link
      to={profile?.role === 'admin' ? '/admin' : profile?.role === 'lider_terreiro' ? '/leader-dashboard' : profile?.role === 'fornecedor' ? '/area-profissional' : '/dashboard'}
      className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
    >
      Meu Painel
    </Link>
  ) : (
    <div className="flex items-center gap-4">
      <Link to="/login" className="text-text-main font-bold text-sm hover:text-primary transition-colors">Entrar</Link>
      <Link to="/register" className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors">Criar Conta</Link>
    </div>
  );

  return (
    <MainLayout navbarProps={{ actionButtons: actionButtons, variant: 'transparent' }} disablePadding={true}>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"></div>
          <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]"></div>
          <img src="/favicon_oribase.png" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] object-contain opacity-[0.03] scale-150 rotate-12" alt="Watermark" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-secondary text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Fundamento Ancestral Digital
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-[100px] font-serif font-bold text-text-main leading-[0.9] mb-8 tracking-tighter">
                Orí<span className="text-secondary font-sans italic font-light tracking-tight">Base</span>.
              </h1>

              <div className="max-w-2xl">
                <h2 className="text-2xl md:text-3xl text-text-main font-medium leading-tight mb-8">
                  Organizar para preservar. <br />
                  <span className="text-primary">Conectar com consciência.</span>
                </h2>
                <p className="text-lg text-text-secondary font-medium leading-relaxed mb-12">
                  Uma plataforma desenhada para respeitar o tempo da tradição,
                  fortalecendo o fundamento digital da sabedoria do Axé através de dados e conexão real.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  {inProgress && (
                    <Link to={`/survey/${inProgress.slug}`} className="group relative overflow-hidden bg-secondary text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-secondary/20 flex items-center justify-center gap-3">
                      <span className="relative z-10">Participar da Campanha</span>
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform relative z-10">explore</span>
                      <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </Link>
                  )}
                  <Link to="/servicos" className="bg-white border-2 border-gray-100 text-text-main px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
                    Rede de Profissionais
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 relative hidden lg:block">
              <div className="relative z-20 aspect-square rounded-[60px] bg-white p-12 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 border border-gray-50 overflow-hidden group">
                <img src="/favicon_oribase.png" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-1000" alt="OríBase Symbol" />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/5 to-transparent"></div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* National Map Section */}
      <section id="mapa" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">Mapeamento Nacional</div>
            <h2 className="text-4xl lg:text-6xl font-serif font-bold text-text-main tracking-tighter mb-4">Nossa presença no <span className="text-primary italic">Mapa</span></h2>
            <p className="max-w-2xl mx-auto text-text-secondary font-medium">Explore e visite virtualmente comunidades tradicionais mapeadas em todo o território nacional.</p>
          </div>
          <TerreiroDiscoverMap />
        </div>
      </section>

      {/* Campaign Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-8 opacity-50 mb-12">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 whitespace-nowrap">Ações Ativas</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inProgress && (
              <div className="p-8 rounded-[40px] bg-secondary/[0.02] border border-gray-100 hover:border-primary/20 transition-all group">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{inProgress.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">{inProgress.description}</p>
                <Link to={`/survey/${inProgress.slug}`} className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 hover:border-primary pb-1 transition-all">
                  Acessar Diagnóstico
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 lg:py-32 bg-background-light">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">Nossa História</div>
              <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-8 text-text-main tracking-tight leading-tight">{aboutTitle}</h2>
              <div className="space-y-4">
                {aboutText.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-text-secondary text-lg font-medium leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl shadow-primary/10 border-8 border-white group">
              {aboutImage ? (
                <img src={aboutImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={aboutTitle} />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-8xl text-gray-200">temple_buddhist</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      {team.length > 0 && (
        <section id="time" className="py-20 lg:py-32 bg-neutral-bg border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">Especialistas</div>
              <h2 className="text-4xl lg:text-6xl font-serif font-bold text-text-main tracking-tighter mb-4">Onde o <span className="text-secondary/50 italic">Orí</span> encontra a <span className="text-secondary italic">Base</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member) => (
                <div key={member.id} className="group bg-white rounded-[40px] p-10 border border-gray-50 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="flex flex-col items-center">
                    <div className="size-32 rounded-[40px] overflow-hidden mb-8 border-4 border-gray-50 group-hover:border-primary/20 transition-all rotate-3 group-hover:rotate-0 duration-500 shadow-inner">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} className="w-full h-full object-cover" alt={member.full_name || ''} />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                          <span className="material-symbols-outlined text-5xl">person</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-black text-text-main uppercase mb-2">{member.full_name}</h3>
                      <div className="inline-block px-3 py-1 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-wider rounded-lg mb-4">{member.job_role || 'Time OríBase'}</div>
                      {member.bio && <p className="text-text-secondary text-sm font-bold italic line-clamp-3">"{member.bio}"</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Support CTA */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-primary rounded-[50px] p-12 lg:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 border-[10px] border-primary-dark/10">
            <div className="relative z-10 max-w-2xl text-center lg:text-left">
              <h2 className="text-4xl lg:text-6xl font-serif font-bold text-white tracking-tighter mb-6 leading-none">
                Fortaleça o <span className="text-secondary italic bg-white/20 px-4 py-1 rounded-2xl">Fundamento</span> do Axé
              </h2>
              <p className="text-white/80 text-lg font-bold">Faça parte desta revolução tecnológica no mundo do Axé. Contribua para o fortalecimento das comunidades tradicionais.</p>
            </div>
            <div className="relative z-10">
              <a href="#faq" className="bg-secondary text-white px-10 py-6 rounded-[30px] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3 group">
                Saiba como participar
                <span className="material-symbols-outlined font-black group-hover:translate-y-1 transition-transform">arrow_downward</span>
              </a>
            </div>
            <span className="absolute -top-20 -right-20 text-white/5 text-[300px] material-symbols-outlined pointer-events-none">handshake</span>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="parceiros" className="py-20 lg:py-32 bg-neutral-bg border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">Nossa Rede</div>
            <h2 className="text-4xl font-black text-text-main uppercase tracking-tight">Instituições <span className="text-primary">Parceiras</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners.map(p => (
              <div key={p.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col group">
                <div className="size-20 bg-gray-50/50 rounded-2xl p-4 flex items-center justify-center mb-6 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                  {p.logo_url ? (
                    <img src={p.logo_url} className="w-full h-full object-contain" alt={p.name} />
                  ) : (
                    <span className="material-symbols-outlined text-gray-300">verified</span>
                  )}
                </div>
                <h3 className="font-black text-text-main uppercase mb-3 tracking-tight">{p.name}</h3>
                {p.description && <p className="text-text-secondary text-sm font-bold line-clamp-3 mb-6 flex-grow">{p.description}</p>}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
                    Saiba Mais
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professionals Preview Section */}
      <section className="py-20 lg:py-32 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">Guia de Serviços</div>
              <h2 className="text-4xl font-black text-text-main uppercase tracking-tight">Rede de <span className="text-primary">Profissionais</span></h2>
              <p className="mt-4 text-text-secondary text-lg font-medium max-w-xl">Encontre especialistas, serviços e produtos da nossa comunidade validados e avaliados.</p>
            </div>
            <Link to="/servicos">
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-text-main rounded-xl font-bold uppercase tracking-wide hover:border-primary hover:text-primary transition-all shadow-sm">
                Ver todos os profissionais
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </Link>
          </div>

          <ProfessionalsListPreview />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest mb-4">Dúvidas Frequentes</div>
            <h2 className="text-4xl font-black text-text-main uppercase tracking-tight">Regras de <span className="text-accent">Apoio</span> e Patrocínio</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.id} className="p-8 bg-gray-50/50 rounded-[40px] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-text-main uppercase tracking-tight">{faq.question}</h4>
                  <span className="material-symbols-outlined text-primary/20 group-hover:text-primary transition-colors">help</span>
                </div>
                <p className="text-text-secondary font-bold leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 pb-20 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="size-10 p-1 bg-white rounded-xl flex items-center justify-center">
                  <img src="/favicon_oribase.png" className="w-full h-full object-contain" alt="OríBase" />
                </div>
                <span className="text-2xl font-black tracking-tighter uppercase">Orí<span className="text-secondary italic">Base</span></span>
              </div>
              <p className="text-white/60 font-bold mb-10 max-w-md">Organizar para preservar. Conectar com consciência. Fundamento digital para a sabedoria do Axé.</p>
              <div className="space-y-4" id="contato">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-sm">mail</span></div>
                  <span className="font-bold text-white/80">{contactEmail}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-sm">call</span></div>
                  <span className="font-bold text-white/80">{contactPhone}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-[10px] font-black uppercase text-accent tracking-widest mb-8">Navegação</h4>
                <ul className="space-y-4">
                  {navbarLinks.map(link => (
                    <li key={link.href}><a href={link.href} className="text-white/60 hover:text-white transition-colors font-bold text-sm uppercase tracking-wide">{link.label}</a></li>
                  ))}
                  <li><Link to="/terreiros" className="text-white/60 hover:text-white transition-colors font-bold text-sm uppercase tracking-wide">Busca de Terreiros</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-accent tracking-widest mb-8">Siga-nos</h4>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 hover:scale-110 transition-all flex items-center justify-center group">
                      <Instagram className="size-5 text-white/40 group-hover:text-white transition-colors" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 hover:scale-110 transition-all flex items-center justify-center group">
                      <Facebook className="size-5 text-white/40 group-hover:text-white transition-colors" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 hover:scale-110 transition-all flex items-center justify-center group">
                      <Linkedin className="size-5 text-white/40 group-hover:text-white transition-colors" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 hover:scale-110 transition-all flex items-center justify-center group">
                      <Youtube className="size-5 text-white/40 group-hover:text-white transition-colors" />
                    </a>
                  )}
                  {socialLinks.whatsapp && (
                    <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 hover:scale-110 transition-all flex items-center justify-center group">
                      <MessageCircle className="size-5 text-white/40 group-hover:text-white transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-white/30 font-bold uppercase tracking-widest">© 2026 OríBase. Fundamento e Consciência.</p>
            <div className="flex gap-8">
              <Link className="text-[10px] text-white/40 hover:text-white transition-colors font-black uppercase tracking-widest" to="/legal?type=terms">Termos</Link>
              <Link className="text-[10px] text-white/40 hover:text-white transition-colors font-black uppercase tracking-widest" to="/legal?type=privacy">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default LandingView;
