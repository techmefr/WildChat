import Peer from 'peerjs'; // Importation de Peer et MediaConnection depuis PeerJS.

export default class PeerService {
  // Déclaration des propriétés privées :
  private peer = new Peer({
    host: 'localhost', // Hôte de ton serveur PeerJS
    port: 9000, // Port de ton serveur
    path: '/peerjs', // Chemin de ton serveur PeerJS
    secure: false, // Secure doit être false si tu n'utilises pas HTTPS
  }); // Initialisation d'une instance PeerJS.
  private _peerId: string | null = null; // Stocke l'identifiant du peer (sera défini une fois connecté).
  private _localStream: MediaStream | null = null; // Stocke le flux audio local (sera défini après l'autorisation d'accès au microphone).
  private _activeCalls: any[] = []; // Tableau pour stocker toutes les connexions actives avec d'autres peers.

  constructor() {
    // Événement déclenché quand le peer est connecté et reçoit un ID unique.
    this.peer.on('open', (id) => {
      this._peerId = id; // Stocke l'ID du peer dans _peerId.
      console.log('Peer ID ouvert:', this._peerId); // Affiche l'ID du peer pour le débogage.
    });

    // Événement d'erreur pour gérer les erreurs liées à PeerJS.
    this.peer.on('error', (err) => {
      console.error('Erreur PeerJS:', err); // Affiche l'erreur dans la console.
    });

    // Demande d'accès au microphone de l'utilisateur. Une fois autorisé, stocke le flux dans _localStream.
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true }) // Seule la partie audio est requise ici, sans la vidéo.
      .then((stream) => {
        this._localStream = stream; // Stocke le flux audio local.
      });
  }

  // Getter pour récupérer l'ID du peer à l'extérieur de la classe.
  get peerId() {
    return this._peerId;
  }

  // Getter pour récupérer le flux audio local à l'extérieur de la classe.
  get localStream() {
    return this._localStream;
  }

  // Méthode pour établir une nouvelle connexion avec un peer distant via son ID, et diffuser le flux audio.
  addNewPeer(remotePeerId: string, audioRef: HTMLAudioElement) {
    // Si le flux local n'est pas encore disponible, on renvoie une erreur.
    if (this._localStream === null) throw new Error('local stream is missing');

    // Appelle le peer distant en lui envoyant le flux audio local.
    // if (remotePeerId !== this.peerId) {
    const call = this.peer.call(remotePeerId, this._localStream);

    // Écoute le flux audio du peer distant et l'attache à l'élément audio HTML via audioRef.
    call.on('stream', (remoteStream) => {
      audioRef.srcObject = remoteStream; // Assigne le flux audio distant à l'élément audio HTML.
    });

    // Ajoute cet appel actif à la liste _activeCalls pour pouvoir le gérer plus tard (fermer, etc.).
    this._activeCalls.push({ call, remotePeerId });
    console.log('Active call : ', this._activeCalls);
    // }

    // Écoute les appels entrants d'autres peers.
    this.peer.on('call', (remoteCall) => {
      // Répond à l'appel avec le flux audio local.
      remoteCall.answer(this._localStream!);

      // Écoute le flux du peer distant et l'attache également à l'élément audio.
      remoteCall.on('stream', (remoteStream) => {
        audioRef.srcObject = remoteStream;
      });
    });
  }

  // Méthode pour fermer toutes les connexions actives avec d'autres peers.
  closeOnCall(peerId: string) {
    for (let call of this._activeCalls) {
      if (call.remotePeerId === peerId) {
        console.log(call.call.connectionId, call.remotePeerId, 'closed');
        call.call.close();
        // Filtrer les appels actifs pour retirer celui avec le même peerId
        this._activeCalls = this._activeCalls.filter((activeCall) => {
          return activeCall.remotePeerId !== peerId;
        });
      }
    }
    console.log('Active calls après suppression : ', this._activeCalls);
  }

  closeCalls() {
    for (let call of this._activeCalls) {
      console.log(call.call.connectionId, call.remotePeerId, 'closed');

      call.call.close(); // Ferme chaque appel.
    }

    this._activeCalls = []; // Réinitialise la liste des appels actifs une fois fermés.
  }
}

const peerService = new PeerService();
export { peerService };
