import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  image: Blob;
}

type Tela = 'vitrine' | 'login' | 'admin';

const CHAVE_STORAGE = 'alexandre_catalog_data';
const IMG_PADRAO =
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=500';

const CATALOGO_INICIAL: Produto[] = [
  {
    id: 1,
    nome: 'Óleo Essencial de Alecrim',
    descricao: 'Estimulante natural ideal para clareza mental, foco e fortalecimento capilar.',
    preco: 38.0,
    image: new Blob(),
  },
  {
    id: 2,
    nome: 'Sabonete Artesanal de Calêndula',
    descricao: 'Formulação suave e cicatrizante para peles sensíveis, enriquecido com manteiga de karité.',
    preco: 22.5,
    image: new Blob(),
  },
  {
    id: 3,
    nome: 'Sérum Facial de Rosa Mosqueta',
    descricao: 'Rico em ácidos graxos e vitaminas, promove regeneração celular e hidratação profunda.',
    preco: 59.9,
    image: new Blob(),
  },
  {
    id: 4,
    nome: 'Manteiga Corporal de Cacau & Amêndoas',
    descricao: 'Nutrição intensa para áreas ressecadas com aroma acolhedor e fórmula 100% veg.',
    preco: 45.0,
    image: new Blob(),
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  readonly instagramUrl = 'https://instagram.com/alexandrecosmeticospvh';
  readonly anoAtual = new Date().getFullYear();

  // Estado
  readonly tela = signal<Tela>('vitrine');
  readonly logado = signal(false);
  readonly produtos = signal<Produto[]>([]);
  readonly modalAberto = signal(false);

  readonly total = computed(() => this.produtos().length);
  readonly precoMedio = computed(() => {
    const lista = this.produtos();
    if (lista.length === 0) return 0;
    return lista.reduce((soma, p) => soma + (Number(p.preco) || 0), 0) / lista.length;
  });

  // Campos do login
  usuario = '';
  senha = '';

  // Campos do modal (id null = novo produto)
  form = this.formVazio();

  ngOnInit(): void {
    this.carregar();
  }

  // ---------- persistência ----------
  private carregar(): void {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE);
      this.produtos.set(salvo ? JSON.parse(salvo) : CATALOGO_INICIAL);
      if (!salvo) this.salvar();
    } catch {
      this.produtos.set(CATALOGO_INICIAL);
    }
  }

  private salvar(): void {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this.produtos()));
    } catch {
      // armazenamento indisponível: o catálogo segue funcionando em memória
    }
  }

  // ---------- navegação ----------
  mostrarTela(destino: Tela): void {
    if (destino === 'login' && this.logado()) destino = 'admin';
    if (destino === 'admin' && !this.logado()) destino = 'login';
    this.tela.set(destino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cliqueAdmin(): void {
    this.mostrarTela(this.logado() ? 'admin' : 'login');
  }

  // ---------- autenticação (apenas demonstração, sem segurança real) ----------
  entrar(): void {
    if (this.usuario.trim() === 'admin' && this.senha.trim() === 'admin') {
      this.logado.set(true);
      this.usuario = '';
      this.senha = '';
      this.mostrarTela('admin');
    } else {
      alert('Usuário ou senha incorretos! Dica: utilize usuário "admin" e senha "admin".');
    }
  }

  sair(): void {
    this.logado.set(false);
    this.mostrarTela('vitrine');
  }

  // ---------- modal / CRUD ----------
  private formVazio() {
    return { id: null as number | null, nome: '', preco: null as number | null, descricao: '', image: new Blob() };
  }

  abrirModal(produto?: Produto): void {
    this.form = produto
      ? { id: produto.id, nome: produto.nome, preco: produto.preco, descricao: produto.descricao, image: produto.image || new Blob() }
      : this.formVazio();
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
  }

  salvarProduto(): void {
    const { id, nome, preco, descricao, image } = this.form;
    const item: Produto = {
      id: id ?? Date.now(),
      nome: nome.trim(),
      preco: Number(preco),
      descricao: descricao.trim(),
      image: image || IMG_PADRAO,
    };

    this.produtos.update((lista) =>
      id !== null ? lista.map((p) => (p.id === id ? item : p)) : [item, ...lista],
    );
    this.salvar();
    this.fecharModal();
  }

  excluir(id: number): void {
    if (confirm('Deseja realmente remover este produto do catálogo?')) {
      this.produtos.update((lista) => lista.filter((p) => p.id !== id));
      this.salvar();
    }
  }

  // ---------- utilidades de template ----------
  preco(valor: number): string {
    return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
  }

  imagem(p: Produto): Blob {
    return p.image || IMG_PADRAO;
  }

  imagemQuebrada(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    if (img.src !== IMG_PADRAO) img.src = IMG_PADRAO;
  }
}