/**
 * Logger d'audit trail pour la pipeline d'ingestion
 * Enregistre toutes les opérations pour traçabilité et debugging
 */

class AuditLogger {
  constructor(supabaseClient, systemUserId) {
    this.supabaseClient = supabaseClient;
    this.systemUserId = systemUserId;
    this.currentBatchName = null;
    this.batchStartTime = null;
    this.operationCounts = {
      ingredient: { created: 0, skipped: 0, error: 0 },
      ustensile: { created: 0, skipped: 0, error: 0 },
      recette: { created: 0, skipped: 0, error: 0 }
    };
  }

  /**
   * Démarre un nouveau batch d'ingestion
   */
  async startBatch(batchName, metadata = {}) {
    try {
      this.currentBatchName = batchName;
      this.batchStartTime = Date.now();
      
      const { data, error } = await this.supabaseClient
        .rpc('log_ingestion_operation', {
          p_batch_name: batchName,
          p_operation_type: 'batch_start',
          p_operation_action: 'started',
          p_source_description: `Démarrage du batch: ${batchName}`,
          p_metadata: JSON.stringify(metadata),
          p_system_user_id: this.systemUserId
        });

      if (error) {
        console.error('Erreur lors du logging de démarrage de batch:', error);
        return null;
      }

      console.log(`📋 Batch "${batchName}" démarré - ID de log: ${data}`);
      return data;

    } catch (error) {
      console.error('Erreur lors du démarrage de batch:', error);
      return null;
    }
  }

  /**
   * Termine un batch d'ingestion
   */
  async endBatch(success = true, errorMessage = null) {
    try {
      if (!this.currentBatchName) {
        console.warn('Aucun batch en cours à terminer');
        return null;
      }

      const processingTime = Date.now() - this.batchStartTime;
      const summary = this._generateBatchSummary();

      const { data, error } = await this.supabaseClient
        .rpc('log_ingestion_operation', {
          p_batch_name: this.currentBatchName,
          p_operation_type: 'batch_end',
          p_operation_action: success ? 'completed' : 'error',
          p_source_description: `Fin du batch: ${this.currentBatchName}`,
          p_metadata: JSON.stringify(summary),
          p_system_user_id: this.systemUserId,
          p_error_message: errorMessage,
          p_processing_time_ms: processingTime
        });

      if (error) {
        console.error('Erreur lors du logging de fin de batch:', error);
        return null;
      }

      console.log(`📊 Batch "${this.currentBatchName}" terminé en ${processingTime}ms`);
      console.log('📈 Résumé des opérations:', summary);

      // Reset pour le prochain batch
      this._resetBatchCounters();
      
      return data;

    } catch (error) {
      console.error('Erreur lors de la fin de batch:', error);
      return null;
    }
  }

  /**
   * Log une opération sur un ingrédient
   */
  async logIngredientOperation(action, ingredientData, entityId = null, errorMessage = null) {
    return this._logEntityOperation('ingredient', action, ingredientData, entityId, errorMessage);
  }

  /**
   * Log une opération sur un ustensile
   */
  async logUstensileOperation(action, ustensileData, entityId = null, errorMessage = null) {
    return this._logEntityOperation('ustensile', action, ustensileData, entityId, errorMessage);
  }

  /**
   * Log une opération sur une recette
   */
  async logRecetteOperation(action, recetteData, entityId = null, errorMessage = null) {
    return this._logEntityOperation('recette', action, recetteData, entityId, errorMessage);
  }

  /**
   * Méthode générique pour logger une opération sur une entité
   */
  async _logEntityOperation(operationType, action, entityData, entityId = null, errorMessage = null) {
    try {
      const operationStartTime = Date.now();
      
      // Préparer les métadonnées
      const metadata = {
        entityData: entityData,
        timestamp: new Date().toISOString()
      };

      // Si c'est une erreur, ajouter des détails
      if (action === 'error' && errorMessage) {
        metadata.errorDetails = errorMessage;
      }

      const { data, error } = await this.supabaseClient
        .rpc('log_ingestion_operation', {
          p_batch_name: this.currentBatchName,
          p_operation_type: operationType,
          p_operation_action: action,
          p_entity_id: entityId,
          p_entity_name: entityData.nom || entityData.name || 'Non spécifié',
          p_source_description: entityData.description || entityData.source_description || null,
          p_metadata: JSON.stringify(metadata),
          p_system_user_id: this.systemUserId,
          p_error_message: errorMessage,
          p_processing_time_ms: Date.now() - operationStartTime
        });

      if (error) {
        console.error(`Erreur lors du logging ${operationType}:`, error);
        return null;
      }

      // Mettre à jour les compteurs
      if (this.operationCounts[operationType] && this.operationCounts[operationType][action] !== undefined) {
        this.operationCounts[operationType][action]++;
      }

      return data;

    } catch (error) {
      console.error(`Erreur lors du logging de l'opération ${operationType}:`, error);
      return null;
    }
  }

  /**
   * Génère un résumé du batch actuel
   */
  _generateBatchSummary() {
    const summary = {
      batchName: this.currentBatchName,
      startTime: new Date(this.batchStartTime).toISOString(),
      endTime: new Date().toISOString(),
      processingTimeMs: Date.now() - this.batchStartTime,
      operations: { ...this.operationCounts }
    };

    // Calculer les totaux
    summary.totals = {};
    Object.keys(this.operationCounts).forEach(type => {
      summary.totals[type] = Object.values(this.operationCounts[type]).reduce((a, b) => a + b, 0);
    });

    summary.grandTotal = Object.values(summary.totals).reduce((a, b) => a + b, 0);

    return summary;
  }

  /**
   * Remet à zéro les compteurs pour un nouveau batch
   */
  _resetBatchCounters() {
    this.currentBatchName = null;
    this.batchStartTime = null;
    this.operationCounts = {
      ingredient: { created: 0, skipped: 0, error: 0 },
      ustensile: { created: 0, skipped: 0, error: 0 },
      recette: { created: 0, skipped: 0, error: 0 }
    };
  }

  /**
   * Retourne les statistiques actuelles du batch
   */
  getCurrentStats() {
    return {
      batchName: this.currentBatchName,
      isRunning: !!this.currentBatchName,
      startTime: this.batchStartTime ? new Date(this.batchStartTime).toISOString() : null,
      elapsedTimeMs: this.batchStartTime ? Date.now() - this.batchStartTime : 0,
      operationCounts: { ...this.operationCounts }
    };
  }

  /**
   * Récupère l'historique des logs pour un batch donné
   */
  async getBatchHistory(batchName, limit = 100) {
    try {
      const { data, error } = await this.supabaseClient
        .from('ingestion_audit_log')
        .select('*')
        .eq('batch_name', batchName)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique du batch:', error);
      return null;
    }
  }

  /**
   * Nettoie les anciens logs (optionnel, pour maintenance)
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await this.supabaseClient
        .from('ingestion_audit_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Erreur lors du nettoyage des logs:', error);
        return false;
      }

      console.log(`🧹 Logs antérieurs à ${cutoffDate.toISOString()} supprimés`);
      return true;

    } catch (error) {
      console.error('Erreur lors du nettoyage des anciens logs:', error);
      return false;
    }
  }
}

module.exports = AuditLogger;