  import { Component, inject } from '@angular/core';
  import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
  import { AuthService } from '../../core/services/auth.service';
  import { Router } from '@angular/router';
  import { CommonModule } from '@angular/common';

  @Component({
    imports: [ReactiveFormsModule, CommonModule],
    selector: 'app-login',
    styleUrl: './login.scss',
    templateUrl: './login.html',
  })


  export class Login {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService)
    private router = inject(Router);

    loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    onSubmit(): void {
      if (this.loginForm.valid) {
        this.authService.login(this.loginForm.value as any).subscribe({
          next: () => {
            this.router.navigate(['/produtos']);
          },
          error: (err) => {
            console.error('Erro na autenticação:', err);
            alert('Falha na autenticação. Por favor, verifique suas credenciais.');
          }
        });
      } else {
      console.log('Formulário inválido:', this.loginForm.value);
      console.log('Erros no email:', this.loginForm.get('email')?.errors);
      console.log('Erros na senha:', this.loginForm.get('password')?.errors);
    }
    }

  }