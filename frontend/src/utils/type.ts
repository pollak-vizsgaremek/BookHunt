export type BookType = 'Book' | 'Manga' | 'Comic';

/**
 * Derives a book type (Book, Manga, or Comic) from categories and title.
 * Works with both BookItem and BookResult interfaces.
 */
export function getBookType(product: { title: string; categories?: string[] }): BookType {
    const categories = (product.categories ?? []).map(c => c.toLowerCase()).join(' ');
    const title = product.title.toLowerCase();
    
    // Manga Check
    if (categories.includes('manga') || title.includes('manga')) {
        return 'Manga';
    }
    
    // Comic Check
    if (categories.includes('comic') || categories.includes('graphic novel') || title.includes('comic') || title.includes('graphic novel')) {
        return 'Comic';
    }
    
    // Default to Book
    return 'Book';
}
