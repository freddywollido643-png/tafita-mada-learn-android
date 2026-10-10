import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { Book, BookOrder, BookAccess } from '../types/database';
import { 
  Library, 
  Search, 
  BookOpen, 
  CheckCircle, 
  ShoppingBag, 
  Truck, 
  X,
  FileText
} from 'lucide-react';

interface BooksPageProps {
  openConfigModal: () => void;
}

export const BooksPage: React.FC<BooksPageProps> = ({ openConfigModal }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userAccess, setUserAccess] = useState<Record<string, boolean>>({});
  const [selectedBookForOrder, setSelectedBookForOrder] = useState<Book | null>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);

  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        setBooks([
          {
            id: 'bk-1',
            title: 'Ohabolana sy Fahendrena Ntaolo',
            author: 'Ratsimbazafy J.',
            category: 'Kolontsaina',
            description: 'Fanangonana ohabolana miisa 500 miaraka amin\'ny fanazavana sy ny toe-javatra fampiasana azy.',
            is_free: true,
          },
          {
            id: 'bk-2',
            title: 'Fitsipi-Pitenenana Malagasy Ara-Rafitra',
            author: 'Prof. Rajaona Siméon',
            category: 'Fianarana',
            description: 'Torolalana lalina momba ny haiteny sy ny fitsipi-pitenenana ho an\'ny ambaratonga faharoa sy ambony.',
            price_mga: 18000,
            is_free: false,
          },
          {
            id: 'bk-3',
            title: 'Kajy sy Matematika Nomerika',
            author: 'Rakotomalala P.',
            category: 'Siansa',
            description: 'Fomba famahana olana ara-matematika sy algorithm fototra ho an\'ny mpianatra.',
            price_mga: 15000,
            is_free: false,
          },
          {
            id: 'bk-4',
            title: 'Tantara sy Fomba Malagasy Fahagola',
            author: 'Rainandriamampandry',
            category: 'Tantara',
            description: 'Vakoka sy tahirin-kevitra momba ny fiaviana sy ny fifindra-monin\'ny foko maro teto Madagasikara.',
            is_free: true,
          },
        ]);

        setUserAccess({ 'bk-1': true, 'bk-4': true });
        setLoading(false);
        return;
      }

      // Supabase is configured: query books using real schema (price_mga, no pages)
      const supabase = getSupabaseClient();
      try {
        const { data: booksData } = await supabase
          .from('books')
          .select('*')
          .order('title', { ascending: true });

        if (booksData && booksData.length > 0) {
          setBooks(booksData as Book[]);
        }

        if (user) {
          const { data: accessData } = await supabase
            .from('book_access')
            .select('book_id')
            .eq('user_id', user.id);

          if (accessData) {
            const map: Record<string, boolean> = {};
            accessData.forEach((a: any) => {
              map[a.book_id] = true;
            });
            setUserAccess(map);
          }
        }
      } catch (err) {
        console.warn('Error loading books from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [user]);

  const handleAccessFreeBook = async (book: Book) => {
    if (!user) {
      setOrderNotification('Mila miditra (connexion) aloha ianao mba hahafahana mamaky.');
      setTimeout(() => setOrderNotification(null), 3500);
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        const { error } = await supabase
          .from('book_access')
          .upsert({
            user_id: user.id,
            book_id: book.id,
            granted_at: new Date().toISOString(),
          });

        if (error) {
          console.warn('book_access RLS error:', error.message);
        }
      } catch (err) {
        console.warn('Failed to grant book access in Supabase:', err);
      }
    }

    setUserAccess(prev => ({ ...prev, [book.id]: true }));
    setReadingBook(book);
  };

  const handleConfirmOrder = async () => {
    if (!user || !selectedBookForOrder) {
      setOrderNotification('Mila miditra (connexion) aloha ianao vao afaka manafatra.');
      setTimeout(() => setOrderNotification(null), 3500);
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        const { error } = await supabase
          .from('book_orders')
          .insert({
            user_id: user.id,
            book_id: selectedBookForOrder.id,
            status: 'pending',
            created_at: new Date().toISOString(),
          });

        if (error) {
          setOrderNotification('Tsy voaray ny kaomandy (RLS): ' + error.message);
          setTimeout(() => setOrderNotification(null), 4000);
          return;
        }
      } catch (err: any) {
        setOrderNotification('Tsy voaray ny kaomandy: ' + (err?.message || 'Erreur'));
        setTimeout(() => setOrderNotification(null), 4000);
        return;
      }
    }

    setOrderNotification(`Voaray ny kaomandin'ny boky « ${selectedBookForOrder.title} » ! Hifandray aminao ny tompon'andraikitra.`);
    setSelectedBookForOrder(null);
    setTimeout(() => setOrderNotification(null), 4000);
  };

  const categories = ['all', ...Array.from(new Set(books.map(b => b.category).filter(Boolean)))];

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
            <Library className="w-3.5 h-3.5" />
            <span>Fivarotam-boky & Tahirin-kevitra</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Boky sy Fitaovam-Pianarana (Livres)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Boky nomerika sy boky azo afatatra amin'ny alalan'ny kaomandy mivantana.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Boky misy : <strong className="text-slate-900">{books.length}</strong>
        </div>
      </div>

      {orderNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{orderNotification}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hikaroka boky na mpanoratra..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-700 outline-none"
        >
          <option value="all">Sokajy rehetra</option>
          {categories.filter(c => c !== 'all').map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Eo am-pampidirana ny lisitry ny boky...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">Tsy misy boky mifanaraka amin'ny sivana.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const hasAccess = userAccess[book.id];
            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Book Card Top Cover Area */}
                <div className="h-44 bg-gradient-to-tr from-slate-800 to-slate-900 p-4 text-white flex flex-col justify-between relative">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded backdrop-blur-xs">
                      {book.category || 'Boky'}
                    </span>
                    {book.is_free ? (
                      <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded shadow-xs">
                        Maimaimpoana
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-300">
                        {book.price_mga ? `${book.price_mga.toLocaleString()} Ar` : 'Misy vidiny'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm leading-tight text-white line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">{book.author || 'Mpanoratra Malagasy'}</p>
                  </div>
                </div>

                {/* Book Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {book.description || 'Boky fampianarana sy fahalalana.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-slate-400">Tahiry nomerika</span>
                    {hasAccess && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Azo vakiana
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-0">
                  {book.is_free || hasAccess ? (
                    <button
                      onClick={() => handleAccessFreeBook(book)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Hamaky izao (Lire)
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedBookForOrder(book)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Hanafatra (Commander)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Order Modal */}
      {selectedBookForOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Fandefasana Kaomandy Boky</h3>
              <button
                onClick={() => setSelectedBookForOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-sm text-slate-900">{selectedBookForOrder.title}</p>
              <p className="text-slate-600">Mpanoratra: {selectedBookForOrder.author}</p>
              <p className="text-emerald-700 font-bold text-base">
                Vidiny: {selectedBookForOrder.price_mga ? `${selectedBookForOrder.price_mga.toLocaleString()} Ar` : 'Maimaimpoana'}
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Fomba fanaterana (Livraison) :</p>
                <p className="text-amber-800">
                  Azo alaina mivantana na aterina manerana an'i Madagasikara (Antananarivo, Toamasina, Mahajanga, Fianarantsoa, Toliara, Antsiranana).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBookForOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Aoka ihany
              </button>
              <button
                onClick={handleConfirmOrder}
                className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
              >
                Hamarino ny Kaomandy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">{readingBook.title}</h3>
                <p className="text-xs text-slate-400">{readingBook.author}</p>
              </div>
              <button
                onClick={() => setReadingBook(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-slate-800 text-xs sm:text-sm leading-relaxed">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-700" />
                <div>
                  <p className="font-bold text-xs text-slate-900">Votoatiny nomerika azo jerena</p>
                  <p className="text-[11px] text-slate-500">Mpianatra nahazo alalana (Book Access)</p>
                </div>
              </div>

              <h4 className="font-bold text-base text-slate-900 pt-2">Toko 1 : Fampidirana</h4>
              <p>
                « Ny fahendrena sy ny fahalalana dia toy ny lambahoany : rehefa itafiana dia mahafana, rehefa ilaozana dia mahatsiaro mangatsiaka. Ny fianarana no fototry ny fahaleovantena ara-tsaina sy ara-piarahamonina. »
              </p>
              <p>
                Ao anatin'ity boky ity, hahita ireo fototra lehibe mampandroso ny fiaraha-monina sy manampy ny mpianatra hahay handalina ianao.
              </p>
              <p>
                Tohizo hatrany ny famakiana sy ny fandalinana ny haisoratra sy ny siansa.
              </p>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-500">Votoatiny Nomerika</span>
              <button
                onClick={() => setReadingBook(null)}
                className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-lg"
              >
                Hakatona
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
