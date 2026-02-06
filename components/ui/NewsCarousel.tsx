import React, { useEffect, useState } from 'react';
import { getNews } from '../../services/news';
import { NewsItem } from '../../types';

const NewsCarousel: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        getNews(true).then(setNews).catch(console.error);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
    };

    if (news.length === 0) return null;

    return (
        <div className="relative w-full max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-text-main">Últimas Notícias</h2>

            <div className="relative overflow-hidden rounded-xl shadow-lg bg-white h-[400px]">
                <div
                    className="flex transition-transform duration-500 ease-in-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {news.map((item) => (
                        <div key={item.id} className="min-w-full h-full flex flex-col md:flex-row">
                            {item.image_url && (
                                <div className="w-full md:w-1/2 h-48 md:h-full">
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className={`w-full ${item.image_url ? 'md:w-1/2' : 'w-full'} p-8 flex flex-col justify-center`}>
                                <div className="text-sm text-primary font-bold mb-2">
                                    {new Date(item.published_at).toLocaleDateString('pt-BR')}
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-text-main">{item.title}</h3>
                                <p className="text-text-secondary line-clamp-4">{item.summary}</p>
                                <button className="mt-6 text-primary font-bold hover:underline self-start">
                                    Ler mais
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {news.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white transition-colors shadow-md"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white transition-colors shadow-md"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </>
                )}
            </div>

            <div className="flex justify-center gap-2 mt-4">
                {news.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary' : 'bg-gray-300'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default NewsCarousel;
