import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  image?: string;
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
        this.produtos.set(dados);
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
    return p.image && p.image.trim() !== '' ? p.image : IMG_PADRAO;
  }

  imagemQuebrada(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    if (img.src !== IMG_PADRAO) img.src = IMG_PADRAO;
  }
}