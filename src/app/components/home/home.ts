import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  image?: string;
}

const IMG_PADRAO = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=500';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/produtos';

  readonly instagramUrl = 'https://instagram.com/alexandrecosmeticospvh';
  readonly anoAtual = new Date().getFullYear();
  readonly produtos = signal<Produto[]>([]);

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.http.get<Produto[]>(this.apiUrl).subscribe({
      next: (dados) => this.produtos.set(dados),
      error: (err) => console.error('Erro ao carregar catálogo:', err)
    });
  }

  precoFormatado(valor: number): string {
    return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
  }

  imagem(p: Produto): string {
    return p.image && p.image.trim() !== '' ? p.image : IMG_PADRAO;
  }

  imagemQuebrada(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    if (img.src !== IMG_PADRAO) img.src = IMG_PADRAO;
  }
}