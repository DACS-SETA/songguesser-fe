import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../core/services/api-service';
import { ITestResponse } from '../core/models/iresponse';

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-view.html',
  styleUrls: ['./dashboard-view.css']
})
export class DashboardViewComponent implements OnInit {

  pingResult = '';
  testResult: ITestResponse | undefined;
  isLoading = true;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // Llamamos a los servicios cuando el componente se inicializa
    this.getPingResult();
    this.getTestResult();
  }

  getPingResult(): void {
    this.apiService.getPing().subscribe(
      (response) => {
        this.pingResult = response;
        console.log('Resultado del Ping:', this.pingResult);
        this.checkLoadingComplete();
      },
      (error) => {
        console.error('Error al hacer ping:', error);
        this.pingResult = 'Error al conectar con el backend.';
        this.checkLoadingComplete();
      }
    );
  }

  getTestResult(): void {
    this.apiService.getTest().subscribe(
      (response) => {
        this.testResult = response;
        console.log('Resultado de Test:', this.testResult);
        this.checkLoadingComplete();
      },
      (error) => {
        console.error('Error al obtener datos de test:', error);
        this.checkLoadingComplete();
      }
    );
  }

  private checkLoadingComplete(): void {
    // Simulamos un pequeño delay para mostrar el loading
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  refreshData(): void {
    this.isLoading = true;
    this.pingResult = '';
    this.testResult = undefined;
    this.getPingResult();
    this.getTestResult();
  }

  getCurrentTime(): string {
    return new Date().toLocaleString('es-ES');
  }
}
