import { Component, computed, signal } from '@angular/core';

type Categoria = 'Todos' | 'Beleza' | 'Saúde' | 'Bem-estar';

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: Exclude<Categoria, 'Todos'>;
  tom: 'folha' | 'mel' | 'argila' | 'creme';
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  // Troque pelo WhatsApp da loja (somente números, com DDI e DDD)
  private readonly whatsapp = '5569900000000';
  readonly instagram = 'alexandrecosmeticospvh';

  readonly categorias: Categoria[] = ['Todos', 'Beleza', 'Saúde', 'Bem-estar'];

  readonly produtos: Produto[] = [
    { id: 1, nome: 'Sabonete de argila verde', descricao: 'Limpa sem ressecar. Indicado para pele mista e oleosa.', preco: 14.9, categoria: 'Beleza', tom: 'folha' },
    { id: 2, nome: 'Óleo de coco extravirgem', descricao: 'Prensado a frio, para cabelo, pele e cozinha.', preco: 29.9, categoria: 'Beleza', tom: 'creme' },
    { id: 3, nome: 'Manteiga de cacau', descricao: 'Hidratação intensa para mãos, cotovelos e lábios.', preco: 22.5, categoria: 'Beleza', tom: 'argila' },
    { id: 4, nome: 'Xarope de guaco e mel', descricao: 'Receita caseira para os dias de garganta irritada.', preco: 27.0, categoria: 'Saúde', tom: 'mel' },
    { id: 5, nome: 'Própolis em gotas', descricao: 'Extrato sem álcool, prático para levar na bolsa.', preco: 34.9, categoria: 'Saúde', tom: 'mel' },
    { id: 6, nome: 'Chá de hibisco e capim-limão', descricao: 'Mistura de ervas secas, 30 g. Serve cerca de 15 xícaras.', preco: 16.0, categoria: 'Bem-estar', tom: 'folha' },
    { id: 7, nome: 'Vela de lavanda', descricao: 'Cera vegetal com pavio de algodão. Queima por 25 horas.', preco: 39.9, categoria: 'Bem-estar', tom: 'creme' },
    { id: 8, nome: 'Sal de banho com ervas', descricao: 'Para o pé cansado no fim do dia. Pote de 300 g.', preco: 24.9, categoria: 'Bem-estar', tom: 'argila' },
  ];

  readonly filtro = signal<Categoria>('Todos');
  readonly carrinho = signal<ItemCarrinho[]>([]);
  readonly carrinhoAberto = signal(false);

  readonly visiveis = computed(() => {
    const f = this.filtro();
    return f === 'Todos' ? this.produtos : this.produtos.filter((p) => p.categoria === f);
  });

  readonly totalItens = computed(() => this.carrinho().reduce((s, i) => s + i.quantidade, 0));
  readonly totalValor = computed(() => this.carrinho().reduce((s, i) => s + i.quantidade * i.produto.preco, 0));

  readonly linkPedido = computed(() => {
    const linhas = this.carrinho().map(
      (i) => `• ${i.quantidade}x ${i.produto.nome} (${this.moeda(i.produto.preco * i.quantidade)})`,
    );
    const texto = `Olá! Gostaria de fazer este pedido:\n${linhas.join('\n')}\n\nTotal: ${this.moeda(this.totalValor())}`;
    return `https://wa.me/${this.whatsapp}?text=${encodeURIComponent(texto)}`;
  });

  moeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  escolher(categoria: Categoria): void {
    this.filtro.set(categoria);
  }

  adicionar(produto: Produto): void {
    this.carrinho.update((itens) => {
      const existente = itens.find((i) => i.produto.id === produto.id);
      if (existente) {
        return itens.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...itens, { produto, quantidade: 1 }];
    });
  }

  alterar(id: number, delta: number): void {
    this.carrinho.update((itens) =>
      itens
        .map((i) => (i.produto.id === id ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0),
    );
  }

  alternarCarrinho(): void {
    this.carrinhoAberto.update((aberto) => !aberto);
  }

  quantidadeDe(id: number): number {
    return this.carrinho().find((i) => i.produto.id === id)?.quantidade ?? 0;
  }
}