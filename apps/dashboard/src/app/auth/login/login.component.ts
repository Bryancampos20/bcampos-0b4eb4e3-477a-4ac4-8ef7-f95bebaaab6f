import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  isSubmitting = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.email || !this.password || this.isSubmitting) return;

    this.isSubmitting = true;
    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/tasks']); // luego creamos /tasks real
      },
      error: (err) => {
        console.error('Login error:', err);
        this.isSubmitting = false;

        // Sin conexión o no se pudo llegar al servidor
        if (err.status === 0) {
          this.error =
            'Unable to reach the server. Please check your connection and try again.';
          return;
        }

        // Credenciales incorrectas
        if (err.status === 401) {
          this.error = 'Invalid email or password.';
          return;
        }

        // Cualquier otro error (500, etc.)
        this.error =
          'Unexpected error while signing in. Please try again in a few minutes.';
      },
    });
  }
}
