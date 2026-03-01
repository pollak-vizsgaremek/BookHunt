import React from 'react';

export interface Product {
    termek_id: number;
    cim: string;
    tipus: string;
    szerzo: string;
    isbn_issn: string;
    boritokep: string;
}

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="group bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full">

            {/* Cover Image */}
            <div className="relative aspect-2/3 w-full overflow-hidden bg-[#242533]">
                {product.boritokep ? (
                    <img
                        src={product.boritokep}
                        alt={product.cim}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = '/images/book_cover.png';
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#DFE6E6]/30">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-[#DFE6E6] text-xs font-bold px-3 py-1 rounded-full border border-white/10 shadow-sm uppercase tracking-wider">
                    {product.tipus}
                </div>
            </div>

            {/* Details */}
            <div className="p-5 flex flex-col grow">
                <h3 className="text-[#DFE6E6] font-serif font-bold text-xl leading-tight line-clamp-2 mb-2 group-hover:text-white transition-colors">
                    {product.cim}
                </h3>

                <p className="text-[#DFE6E6]/70 font-medium text-sm mb-4 line-clamp-1">
                    {product.szerzo || 'Unknown Author'}
                </p>

                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[#DFE6E6]/50 text-xs font-mono bg-black/30 px-2 py-1 rounded">
                        {product.isbn_issn || 'N/A'}
                    </span>
                    <button className="text-[#DFE6E6]/80 hover:text-white bg-white/5 hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default ProductCard;
