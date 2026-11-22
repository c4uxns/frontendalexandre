import {
  AfterViewInit, Component, DestroyRef, ElementRef, HostListener, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string;
  image?: string;
}

const IMG_PADRAO = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=500';

const normalizar = (valor: string): string =>
  valor.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const chave = (p: Produto): string => String(p.id ?? p.nome);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);
  private readonly apiUrl = 'http://localhost:8080/v1/produtos';
  private readonly reduzirMovimento =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  readonly instagramUrl = 'https://instagram.com/alexandrecosmeticospvh';
  readonly anoAtual = new Date().getFullYear();

  readonly produtos = signal<Produto[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal(false);
  readonly busca = signal('');
  readonly esqueleto = Array.from({ length: 6 }, (_, i) => i);

  // Rolagem
  readonly rolou = signal(false);
  readonly progresso = signal(0);
  readonly mostrarTopo = signal(false);

  // Favoritos (persistidos no navegador)
  readonly favoritos = signal<Set<string>>(this.lerFavoritos());
  readonly somenteFavoritos = signal(false);
  readonly totalFavoritos = computed(() => this.favoritos().size);
  readonly bump = signal(false);

  // Folhas caindo no hero
  readonly folhas = Array.from({ length: 9 }, (_, id) => ({
    id,
    left: 5 + id * 11 + (id % 3) * 2,
    size: 14 + ((id * 7) % 16),
    dur: 11 + ((id * 5) % 9),
    delay: -((id * 3) % 12),
  }));

  readonly produtosFiltrados = computed(() => {
    const termo = normalizar(this.busca());
    const favs = this.favoritos();
    return this.produtos().filter(
      (p) =>
        (!termo || normalizar(p.nome).includes(termo)) &&
        (!this.somenteFavoritos() || favs.has(chave(p))),
    );
  });

  readonly rotuloResultado = computed(() => {
    const total = this.produtosFiltrados().length;
    return `${total} ${total === 1 ? 'produto' : 'produtos'}`;
  });

  ngOnInit(): void {
    this.carregarProdutos();
  }

  ngAfterViewInit(): void {
    // Revela cabeçalho do catálogo e rodapé ao entrarem na tela
    const els = this.host.nativeElement.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || this.reduzirMovimento) {
      els.forEach((e) => e.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.2 },
    );
    els.forEach((e) => io.observe(e));
    this.destroyRef.onDestroy(() => io.disconnect());
    this.onScroll();
  }

  carregarProdutos(): void {
    this.carregando.set(true);
    this.erro.set(false);

    this.http.get<Produto[]>(this.apiUrl).subscribe({
      next: (dados) => {
        this.produtos.set((dados || []).filter((p) => p !== null && p !== undefined));
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar catálogo:', err);
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  onBusca(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }

  limparBusca(): void {
    this.busca.set('');
  }

  precoFormatado(valor: number): string {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  imagem(p: Produto): string {
    const imgData = p.imagem || p.image;
    if (!imgData || imgData.trim() === '') return IMG_PADRAO;
    if (imgData.startsWith('http') || imgData.startsWith('data:')) return imgData;
    return `data:image/jpeg;base64,${imgData}`;
  }

  imagemQuebrada(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    if (img.src !== IMG_PADRAO) img.src = IMG_PADRAO;
  }

  // ---------- Favoritos ----------
  ehFavorito(p: Produto): boolean {
    return this.favoritos().has(chave(p));
  }

  alternarFavorito(p: Produto): void {
    const novo = new Set(this.favoritos());
    const k = chave(p);
    novo.has(k) ? novo.delete(k) : novo.add(k);
    this.favoritos.set(novo);
    try { localStorage.setItem('favoritos', JSON.stringify([...novo])); } catch { /* ignora */ }
    this.bump.set(true);
    setTimeout(() => this.bump.set(false), 300);
  }

  alternarFiltroFavoritos(): void {
    this.somenteFavoritos.update((v) => !v);
  }

  private lerFavoritos(): Set<string> {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem('favoritos') ?? '[]'));
    } catch {
      return new Set();
    }
  }

  // ---------- Rolagem ----------
  @HostListener('window:scroll')
  onScroll(): void {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.rolou.set(y > 40);
    this.mostrarTopo.set(y > 600);
    this.progresso.set(max > 0 ? Math.min(100, (y / max) * 100) : 0);
  }

  voltarAoTopo(): void {
    window.scrollTo({ top: 0, behavior: this.reduzirMovimento ? 'auto' : 'smooth' });
  }

  // ---------- Parallax do hero ----------
  onHeroMove(e: MouseEvent): void {
    if (this.reduzirMovimento) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5) * 2));
  }

  onHeroLeave(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
  }

  // ---------- Inclinação 3D dos cards ----------
  onTilt(e: MouseEvent): void {
    if (this.reduzirMovimento) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * 10}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  }

  onTiltLeave(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  // ---------- Botões: ondulação (ripple) ----------
  @HostListener('click', ['$event'])
  onClick(e: MouseEvent): void {
    const alvo = (e.target as HTMLElement).closest<HTMLElement>('.btn, .btn-contact, .fab, .heart, .chip, .footer__link');
    if (!alvo || this.reduzirMovimento) return;
    const r = alvo.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2;
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    alvo.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  }

  // ---------- Botões: efeito magnético ----------
  @HostListener('mousemove', ['$event'])
  onMagnet(e: MouseEvent): void {
    if (this.reduzirMovimento) return;
    const alvo = (e.target as HTMLElement).closest<HTMLElement>('[data-magnetic]');
    if (!alvo) return;
    const r = alvo.getBoundingClientRect();
    alvo.style.setProperty('--tx', `${(e.clientX - (r.left + r.width / 2)) * 0.22}px`);
    alvo.style.setProperty('--ty', `${(e.clientY - (r.top + r.height / 2)) * 0.3}px`);
  }

  @HostListener('mouseout', ['$event'])
  onMagnetOut(e: MouseEvent): void {
    const alvo = (e.target as HTMLElement).closest<HTMLElement>('[data-magnetic]');
    if (!alvo || alvo.contains(e.relatedTarget as Node)) return;
    alvo.style.setProperty('--tx', '0px');
    alvo.style.setProperty('--ty', '0px');
  }
}