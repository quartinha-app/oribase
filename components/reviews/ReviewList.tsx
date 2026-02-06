import React from 'react';
import { Review } from '../../types';

interface ReviewListProps {
    reviews: Review[];
    loading?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, loading }) => {
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-50 h-24 rounded-2xl border border-gray-100" />
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">rate_review</span>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-wide">Seja o primeiro a avaliar!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map(review => (
                <div key={review.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                                {review.user?.avatar_url ? (
                                    <img src={review.user.avatar_url} alt={review.user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-gray-300">person</span>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-text-main text-sm">{review.user?.full_name || 'Anônimo'}</div>
                                <div className="text-xs text-gray-400 font-medium">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} className={`material-symbols-outlined text-sm ${star <= review.rating ? 'fill-current' : 'opacity-30'}`}>
                                    star
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                </div>
            ))}
        </div>
    );
};

export default ReviewList;
