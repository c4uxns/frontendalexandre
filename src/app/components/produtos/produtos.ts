import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  imagem?: any; // Pode vir como array de bytes ou string
}

const IMG_PADRAO = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=500';

@Component({
  selector: 'app-produtos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './produtos.html',
  styleUrl: './produtos.scss',
})
export class Produtos implements OnInit {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/v1/produtos';

  readonly produtos = signal<Produto[]>([]);
  readonly modalAberto = signal(false);
  readonly carregando = signal(false);
  readonly salvando = signal(false); // Trava contra cliques duplos

  readonly total = computed(() => this.produtos().length);
  readonly precoMedio = computed(() => {
    const lista = this.produtos();
    if (lista.length === 0) return 0;
    return lista.reduce((soma, p) => soma + (Number(p.preco) || 0), 0) / lista.length;
  });

  form = this.formVazio();

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando.set(true);
    this.http.get<Produto[]>(this.apiUrl).subscribe({
      next: (dados) => {
        this.produtos.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao buscar produtos:', err);
        this.carregando.set(false);
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const tamanhoMaximoEmBytes = 10 * 1024 * 1024; // 10 Megabytes

      if (file.size > tamanhoMaximoEmBytes) {
        alert('A imagem é muito grande! O tamanho máximo permitido é de 10MB.');
        event.target.value = '';
        this.form.imagemArquivo = null;
        return;
      }

      this.form.imagemArquivo = file;
    }
  }

  salvarProduto(): void {
    if (this.salvando()) return; // Impede novos cliques enquanto processa
    this.salvando.set(true);

    const { id, nome, preco, descricao, quantidade, imagemArquivo } = this.form;
    
    const formData = new FormData();
    formData.append('nome', nome?.trim() || '');
    formData.append('preco', String(Number(preco) || 0));
    formData.append('descricao', descricao?.trim() || '');
    formData.append('quantidade', String(Number(quantidade) || 0));
    
    if (imagemArquivo) {
      formData.append('imagem', imagemArquivo);
    }

    if (id) {
      this.http.put<Produto>(`${this.apiUrl}/${id}`, formData).subscribe({
        next: (produtoAtualizado) => {
          this.produtos.update((lista) => lista.map((p) => (p.id === id ? produtoAtualizado : p)));
          this.salvando.set(false);
          this.fecharModal();
        },
        error: (err) => {
          console.error('Erro ao atualizar:', err);
          alert('Erro ao atualizar o produto. Verifique o console.');
          this.salvando.set(false);
        }
      });
    } else {
      this.http.post<Produto>(this.apiUrl, formData).subscribe({
        next: (novoProduto) => {
          this.produtos.update((lista) => [novoProduto, ...lista]);
          this.salvando.set(false);
          this.fecharModal();
        },
        error: (err) => {
          console.error('Erro ao cadastrar:', err);
          alert('Erro ao cadastrar o produto. Verifique o console.');
          this.salvando.set(false);
        }
      });
    }
  }

  excluirProduto(produto: Produto): void {
    if (!produto.id) return;
    
    if (confirm(`Deseja realmente remover o produto "${produto.nome}"?`)) {
      this.http.delete(`${this.apiUrl}/${produto.id}`).subscribe({
        next: () => {
          this.produtos.update((lista) => lista.filter((p) => p.id !== produto.id));
        },
        error: (err) => {
          console.error('Erro ao excluir:', err);
          alert(`Erro ao excluir o produto "${produto.nome}".`);
        }
      });
    }
  }

  private formVazio() {
    return { 
      id: undefined as number | undefined, 
      nome: '', 
      preco: null as number | null, 
      descricao: '', 
      quantidade: null as number | null, 
      imagemArquivo: null as File | null 
    };
  }

  abrirModal(produto?: Produto): void {
    this.form = produto
      ? { 
          id: produto.id, 
          nome: produto.nome, 
          preco: produto.preco, 
          descricao: produto.descricao, 
          quantidade: produto.quantidade, 
          imagemArquivo: null 
        }
      : this.formVazio();
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
  }

  precoFormatado(valor: number): string {
    return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
  }

  // Converte os bytes do banco (array de números) em Base64 para exibir na tag <img> com segurança
  imagem(p: Produto): string {
    if (!p.imagem) return IMG_PADRAO;

    if (typeof p.imagem === 'string') {
      if (p.imagem.startsWith('http') || p.imagem.startsWith('data:')) {
        return p.imagem;
      }
      return `data:image/jpeg;base64,${p.imagem}`;
    }

    if (Array.isArray(p.imagem)) {
      try {
        const uint8Array = new Uint8Array(p.imagem);
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        return `data:image/jpeg;base64,${btoa(binary)}`;
      } catch (e) {
        return IMG_PADRAO;
      }
    }

    return IMG_PADRAO;
  }

  imagemQuebrada(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    if (img.src !== IMG_PADRAO) img.src = IMG_PADRAO;
  }
}