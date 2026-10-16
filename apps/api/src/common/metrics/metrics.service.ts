// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Métriques Prometheus pour l'API
// Conforme ST §5.4 : latence par route, durée de génération, taille des files, taux d'erreurs 422, e-mails en échec

import { Injectable, Scope, OnModuleDestroy } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Gauge,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * Registre Prometheus pour les métriques de l'API TAKT.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class MetricsService implements OnModuleDestroy {
  private readonly registry: Registry;

  // --- Métriques HTTP ---
  readonly httpRequestsTotal: Counter;
  readonly httpRequestDuration: Histogram;
  readonly httpRequestsActive: Gauge;

  // --- Métriques de jobs (pg-boss / worker) ---
  readonly jobQueueSize: Gauge;
  readonly jobDuration: Histogram;
  readonly jobErrorsTotal: Counter;

  // --- Métriques métier spécifiques ---
  readonly generationDuration: Histogram;
  readonly exportDuration: Histogram;
  readonly emailErrorsTotal: Counter;
  readonly failedQueueSize: Gauge;

  constructor() {
    this.registry = new Registry();

    // Métriques par défaut Node.js (CPU, mémoire, event loop, etc.)
    collectDefaultMetrics({ register: this.registry, prefix: 'nodejs_' });

    // --- Compteur de requêtes HTTP ---
    this.httpRequestsTotal = new Counter({
      name: 'takt_http_requests_total',
      help: 'Nombre total de requêtes HTTP par méthode, route et statut',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // --- Durée des requêtes HTTP ---
    this.httpRequestDuration = new Histogram({
      name: 'takt_http_request_duration_seconds',
      help: 'Durée des requêtes HTTP en secondes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // --- Requêtes actives ---
    this.httpRequestsActive = new Gauge({
      name: 'takt_http_requests_active',
      help: 'Nombre de requêtes HTTP en cours',
      registers: [this.registry],
    });

    // --- Taille des files de jobs ---
    this.jobQueueSize = new Gauge({
      name: 'takt_job_queue_size',
      help: 'Nombre de jobs en attente dans chaque file',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    // --- Durée des jobs ---
    this.jobDuration = new Histogram({
      name: 'takt_job_duration_seconds',
      help: 'Durée d’exécution des jobs',
      labelNames: ['queue', 'status'],
      buckets: [1, 5, 10, 30, 60, 120, 300, 600],
      registers: [this.registry],
    });

    // --- Erreurs de jobs ---
    this.jobErrorsTotal = new Counter({
      name: 'takt_job_errors_total',
      help: 'Nombre d’erreurs de jobs par file et type',
      labelNames: ['queue', 'error_type'],
      registers: [this.registry],
    });

    // --- Durée de génération FET ---
    this.generationDuration = new Histogram({
      name: 'takt_generation_duration_seconds',
      help: 'Durée des générations FET',
      buckets: [30, 60, 120, 300, 600, 900, 1800],
      registers: [this.registry],
    });

    // --- Durée d'export ---
    this.exportDuration = new Histogram({
      name: 'takt_export_duration_seconds',
      help: 'Durée des exports',
      buckets: [5, 15, 30, 60, 120, 300, 600],
      registers: [this.registry],
    });

    // --- Erreurs d'e-mail ---
    this.emailErrorsTotal = new Counter({
      name: 'takt_email_errors_total',
      help: 'Nombre d’erreurs d’envoi d’e-mail',
      registers: [this.registry],
    });

    // --- Taille de la file d'échecs ---
    this.failedQueueSize = new Gauge({
      name: 'takt_failed_queue_size',
      help: 'Nombre de jobs en échec dans la file d’échecs',
      registers: [this.registry],
    });
  }

  /**
   * Retourne le registre Prometheus pour exposition via endpoint /metrics.
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Incrémente le compteur de requêtes HTTP.
   */
  recordHttpRequest(method: string, route: string, statusCode: number): void {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: String(statusCode),
    });
  }

  /**
   * Observe la durée d'une requête HTTP.
   */
  observeHttpRequestDuration(
    method: string,
    route: string,
    statusCode: number,
    seconds: number,
  ): void {
    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: String(statusCode),
      },
      seconds,
    );
  }

  /**
   * Incrémente/décrémente les requêtes actives.
   */
  setHttpRequestsActive(count: number): void {
    this.httpRequestsActive.set(count);
  }

  /**
   * Met à jour la taille d'une file de jobs.
   */
  setJobQueueSize(queue: string, size: number): void {
    this.jobQueueSize.set({ queue }, size);
  }

  /**
   * Observe la durée d'un job.
   */
  observeJobDuration(queue: string, status: string, seconds: number): void {
    this.jobDuration.observe({ queue, status }, seconds);
  }

  /**
   * Incrémente le compteur d'erreurs de job.
   */
  incrementJobErrors(queue: string, errorType: string): void {
    this.jobErrorsTotal.inc({ queue, error_type: errorType });
  }

  /**
   * Observe la durée d'une génération FET.
   */
  observeGenerationDuration(seconds: number): void {
    this.generationDuration.observe(seconds);
  }

  /**
   * Observe la durée d'un export.
   */
  observeExportDuration(seconds: number): void {
    this.exportDuration.observe(seconds);
  }

  /**
   * Incrémente le compteur d'erreurs e-mail.
   */
  incrementEmailErrors(): void {
    this.emailErrorsTotal.inc();
  }

  /**
   * Met à jour la taille de la file d'échecs.
   */
  setFailedQueueSize(size: number): void {
    this.failedQueueSize.set(size);
  }

  onModuleDestroy(): void {
    // Rien à nettoyer pour le registre
  }
}