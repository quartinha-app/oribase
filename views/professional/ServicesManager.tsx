import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getProfessionalByUserId, Professional } from '../../services/professional';
import {
    getProfessionalServices,
    createProfessionalService,
    updateProfessionalService,
    deleteProfessionalService
} from '../../services/professional';
import { ProfessionalService } from '../../types';

interface ServiceForm {
    title: string;
    description: string;
    price: string; // Handle as string for input, convert to number
    duration: string;
}

const ServicesManager: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [professional, setProfessional] = useState<Professional | null>(null);
    const [services, setServices] = useState<ProfessionalService[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ServiceForm>();

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const prof = await getProfessionalByUserId(user!.id);
            if (!prof) {
                navigate('/cadastro-profissional');
                return;
            }
            setProfessional(prof);

            const srvs = await getProfessionalServices(prof.id);
            setServices(srvs || []);
        } catch (error) {
            console.error('Error loading services:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: ServiceForm) => {
        if (!professional) return;

        try {
            setActionLoading(true);
            const serviceData = {
                professional_id: professional.id,
                title: data.title,
                description: data.description,
                price: data.price ? parseFloat(data.price) : undefined,
                duration: data.duration
            };

            if (editingId) {
                await updateProfessionalService(editingId, serviceData);
                setEditingId(null);
            } else {
                if (services.length >= 5) {
                    alert('Você já atingiu o limite de 5 serviços.');
                    return;
                }
                await createProfessionalService(serviceData);
            }

            reset();
            const updatedServices = await getProfessionalServices(professional.id);
            setServices(updatedServices || []);
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Erro ao salvar serviço.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este serviço?')) return;

        try {
            setActionLoading(true);
            await deleteProfessionalService(id);
            setServices(services.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Erro ao remover serviço.');
        } finally {
            setActionLoading(false);
        }
    };

    const startEdit = (service: ProfessionalService) => {
        setEditingId(service.id);
        setValue('title', service.title);
        setValue('description', service.description || '');
        setValue('price', service.price?.toString() || '');
        setValue('duration', service.duration || '');

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        reset();
    };

    if (loading) {
        return (
            <MainLayout variant="app">
                <div className="flex justify-center p-20">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout variant="app" subtitle="Gerenciar Serviços">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-text-main mb-2">Meus Serviços</h1>
                        <p className="text-text-secondary">Cadastre até 5 serviços principais para exibir no seu perfil.</p>
                    </div>
                    <Link to="/area-profissional">
                        <button className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                            Voltar
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
                            <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">add_circle</span>
                                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
                            </h2>

                            {services.length >= 5 && !editingId ? (
                                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-medium border border-amber-100 mb-4">
                                    Você atingiu o limite de 5 serviços. Remova ou edite um existente.
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                        <input
                                            {...register('title', { required: true })}
                                            className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
                                            placeholder="Ex: Jogo de Búzios"
                                        />
                                        {errors.title && <span className="text-red-500 text-xs mt-1 block">Obrigatório</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                                        <textarea
                                            {...register('description')}
                                            className="w-full h-24 p-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium resize-none"
                                            placeholder="Detalhes sobre como funciona..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (R$)</label>
                                            <input
                                                {...register('price')}
                                                type="number"
                                                step="0.01"
                                                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duração</label>
                                            <input
                                                {...register('duration')}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
                                                placeholder="Ex: 1h"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={actionLoading}
                                            className="flex-1 h-10 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            {actionLoading ? <span className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (editingId ? 'Atualizar' : 'Adicionar')}
                                        </button>
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold text-sm transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* List Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {services.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">playlist_add</span>
                                <h3 className="font-bold text-gray-400">Nenhum serviço cadastrado</h3>
                                <p className="text-xs text-gray-400 mt-1">Preencha o formulário ao lado para começar.</p>
                            </div>
                        ) : (
                            services.map(service => (
                                <div key={service.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between gap-4 group hover:border-primary/20 transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-text-main text-lg">{service.title}</h3>
                                            {(service.price || service.duration) && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                                    {service.price && <span>R$ {service.price}</span>}
                                                    {service.price && service.duration && <span>•</span>}
                                                    {service.duration && <span>{service.duration}</span>}
                                                </div>
                                            )}
                                        </div>
                                        {service.description && (
                                            <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-start gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(service)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ServicesManager;
