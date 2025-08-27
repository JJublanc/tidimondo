import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ContactFormData, ContactSubmissionResponse } from '@/types/contact';

// Initialiser Resend seulement si la clé API est présente
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Rate limiting simple - en mémoire (à améliorer pour la production)
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure
const RATE_LIMIT_MAX = 5; // 5 messages par heure par IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit) {
    rateLimit.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // Reset si la fenêtre de temps est expirée
  if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // Vérifier si la limite est atteinte
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  // Incrémenter le compteur
  userLimit.count++;
  return true;
}

function validateContactData(data: any): ContactFormData | null {
  if (!data.nom || typeof data.nom !== 'string' || data.nom.trim().length === 0) {
    return null;
  }
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    return null;
  }
  if (!data.sujet || typeof data.sujet !== 'string' || data.sujet.trim().length === 0) {
    return null;
  }
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
    return null;
  }

  return {
    nom: data.nom.trim(),
    email: data.email.trim(),
    sujet: data.sujet.trim(),
    message: data.message.trim()
  };
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'IP pour le rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Vérifier le rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Trop de tentatives. Veuillez réessayer dans une heure.' 
        } as ContactSubmissionResponse,
        { status: 429 }
      );
    }

    // Récupérer et valider les données
    const data = await request.json();
    const validatedData = validateContactData(data);

    if (!validatedData) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Données invalides. Veuillez vérifier tous les champs.' 
        } as ContactSubmissionResponse,
        { status: 400 }
      );
    }

    // Préparer l'email
    const emailContent = `
      <h2>Nouveau message de contact - TidiMondo</h2>
      <p><strong>Nom:</strong> ${validatedData.nom}</p>
      <p><strong>Email:</strong> ${validatedData.email}</p>
      <p><strong>Sujet:</strong> ${validatedData.sujet}</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
        ${validatedData.message.replace(/\n/g, '<br>')}
      </div>
      <hr>
      <p><small>Message envoyé depuis le formulaire de contact de TidiMondo</small></p>
    `;

    // Mode développement : si Resend n'est pas configuré, logger le message
    if (!resend) {
      console.log('=== MODE DÉVELOPPEMENT - MESSAGE DE CONTACT ===');
      console.log('De:', validatedData.email);
      console.log('Nom:', validatedData.nom);
      console.log('Sujet:', validatedData.sujet);
      console.log('Message:', validatedData.message);
      console.log('=== FIN MESSAGE ===');
      
      return NextResponse.json(
        {
          success: true,
          message: 'Mode développement : Votre message a été reçu et affiché dans la console du serveur. Configurez RESEND_API_KEY pour l\'envoi réel d\'emails.'
        } as ContactSubmissionResponse,
        { status: 200 }
      );
    }

    // Envoyer l'email via Resend
    try {
      const emailResult = await resend.emails.send({
        from: 'onboarding@resend.dev', // Adresse par défaut Resend qui fonctionne immédiatement
        to: 'neovalerian42@gmail.com',
        subject: `[TidiMondo Contact] ${validatedData.sujet}`,
        html: emailContent,
        replyTo: validatedData.email
      });

      if (!emailResult.data) {
        console.error('Erreur Resend:', emailResult.error);
        
        // Mode fallback développement si clé API invalide
        if (emailResult.error?.name === 'validation_error') {
          console.log('=== FALLBACK MODE DÉVELOPPEMENT (Clé API invalide) ===');
          console.log('De:', validatedData.email);
          console.log('Nom:', validatedData.nom);
          console.log('Sujet:', validatedData.sujet);
          console.log('Message:', validatedData.message);
          console.log('=== FIN MESSAGE ===');
          
          return NextResponse.json(
            {
              success: true,
              message: 'Mode développement : Votre message a été reçu et affiché dans la console. Configurez une clé API Resend valide pour l\'envoi réel d\'emails.'
            } as ContactSubmissionResponse,
            { status: 200 }
          );
        }
        
        return NextResponse.json(
          {
            success: false,
            message: 'Erreur lors de l\'envoi du message. Veuillez réessayer.'
          } as ContactSubmissionResponse,
          { status: 500 }
        );
      }

      // Succès
      return NextResponse.json(
        {
          success: true,
          message: 'Votre message a été envoyé avec succès. Nous vous répondrons rapidement!'
        } as ContactSubmissionResponse,
        { status: 200 }
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi email:', error);
      
      // Mode fallback développement en cas d'erreur Resend
      console.log('=== FALLBACK MODE DÉVELOPPEMENT (Erreur Resend) ===');
      console.log('De:', validatedData.email);
      console.log('Nom:', validatedData.nom);
      console.log('Sujet:', validatedData.sujet);
      console.log('Message:', validatedData.message);
      console.log('=== FIN MESSAGE ===');
      
      return NextResponse.json(
        {
          success: true,
          message: 'Mode développement : Votre message a été reçu et affiché dans la console. Configurez Resend correctement pour l\'envoi réel d\'emails.'
        } as ContactSubmissionResponse,
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Erreur dans /api/contact:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur interne du serveur. Veuillez réessayer plus tard.' 
      } as ContactSubmissionResponse,
      { status: 500 }
    );
  }
}