import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createReview } from '../../services/reviews';
import { getFingerprint } from '../../services/fingerprint';

interface ReviewFormProps {
    professionalId: string;
    onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ professionalId, onSuccess }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Por favor, selecione uma nota.');
            return;
        }

        try {
            setLoading(true);
            const fp = await getFingerprint();

            await createReview({
                professional_id: professionalId,
                user_id: user?.id,
                fingerprint_id: fp,
                rating,
                comment
            });

            setRating(0);
            setComment('');
            onSuccess();
            alert('Avaliação enviada com sucesso!');
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Erro ao enviar avaliação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Escrever Avaliação</h3>

            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sua Nota</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                        >
                            <span
                                className={`material-symbols-outlined text-2xl ${star <= (hoverRating || rating)
                                        ? 'text-amber-500 fill-current'
                                        : 'text-gray-200'
                                    }`}
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                star
                            </span>
                        </button>
                    ))}
                </div>
                <div className="text-xs font-medium text-amber-600 mt-1 h-4">
                    {hoverRating > 0 ? getRatingLabel(hoverRating) : (rating > 0 ? getRatingLabel(rating) : '')}
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Seu Comentário</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all resize-none h-24"
                    placeholder="Conte como foi sua experiência com este profissional..."
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading || rating === 0}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            Enviar Avaliação
                            <span className="material-symbols-outlined text-lg">send</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

const getRatingLabel = (rating: number) => {
    switch (rating) {
        case 1: return 'Ruim';
        case 2: return 'Razoável';
        case 3: return 'Bom';
        case 4: return 'Muito Bom';
        case 5: return 'Excelente';
        default: return '';
    }
};

export default ReviewForm;
