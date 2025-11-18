import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { UserProfile } from '../core/models/user-profile';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  userProfile: UserProfile | null = null;
  editData = { username: '', avatarUrl: '' };
  showToast: boolean = false;

  @ViewChild('settingsDialog') settingsDialog!: ElementRef<HTMLDialogElement>;

  constructor(private userService: UserService, private keycloakService: KeycloakService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  openSettings(): void {
    if (this.userProfile) {
      this.editData.username = this.userProfile.username;
      this.editData.avatarUrl = this.userProfile.avatarUrl || '';
    }
    this.settingsDialog.nativeElement.showModal();
  }

  closeSettings(): void {
    this.settingsDialog.nativeElement.close();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.editData.avatarUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    this.userService.updateProfile(this.editData).subscribe({
      next: () => {
        this.showToast = true;
        this.loadProfile(); // Recargar el perfil
        this.closeSettings();
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        alert('Error al actualizar el perfil');
      }
    });
  }

  logout(): void {
    this.keycloakService.logout();
  }
}
