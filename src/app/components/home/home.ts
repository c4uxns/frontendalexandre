import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string; // Nome do arquivo ou URL da imagem vinda do back-end
  image?: string; // Nome do arquivo ou URL da imagem vinda do back-end
}

  const IMG_PADRAO = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=500';

const normalizar = (valor: string): string =>
  valor
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})

export class Home implements OnInit {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/v1/produtos';

  readonly instagramUrl = 'https://instagram.com/alexandrecosmeticospvh';
  readonly anoAtual = new Date().getFullYear();

  readonly produtos = signal<Produto[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal(false);
  readonly busca = signal('');
  readonly esqueleto = Array.from({ length: 6 }, (_, i) => i);

  readonly produtosFiltrados = computed(() => {
    const termo = normalizar(this.busca());
    if (!termo) return this.produtos();
    return this.produtos().filter((p) => normalizar(p.nome).includes(termo));
  });

  readonly rotuloResultado = computed(() => {
    const total = this.produtosFiltrados().length;
    return `${total} ${total === 1 ? 'produto' : 'produtos'}`;
  });

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando.set(true);
    this.erro.set(false);

    this.http.get<Produto[]>(this.apiUrl).subscribe({
      next: (dados) => {
        const listaLimpa = (dados || []).filter(p => p !== null && p !== undefined);
        this.produtos.set(listaLimpa);
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

  // Método ajustado para ligar o nome do arquivo ao endpoint de uploads
  imagem(p: Produto): string {
    // Alinhe para p.imagem ou p.image conforme a sua interface Produto
    const imgData = p.imagem || p.image; 

    if (!imgData || imgData.trim() === '') {
      return IMG_PADRAO;
    }

    // Se já for uma URL externa (ex: Unsplash)
    if (imgData.startsWith('http')) {
      return imgData;
    }

    // Se já vier com o prefixo data: do base64
    if (imgData.startsWith('data:')) {
      return imgData;
    }

    // Se for uma string Base64 pura (sem o prefixo), adicionamos o prefixo para o HTML renderizar
    return `data:image/jpeg;base64,${imgData}`;
  }

  imagemQuebrada(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    if (img.src !== IMG_PADRAO) img.src = IMG_PADRAO;
  }
}