import { Component } from '@angular/core';
import { PublicationService } from 'src/app/services/publication.service';
import { Utilisateur } from 'src/app/models/Utilisateur';
import { OnInit } from '@angular/core';
import { UtilisateurService } from 'src/app/services/utilisateur.service';
import { Publication } from 'src/app/models/Publication';
import { Tile } from 'src/app/models/Tile';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private publicationService  : PublicationService,private utilisateurService : UtilisateurService) { }

   utilisateur : Utilisateur | undefined;
   publicationList: Publication[] = [];
   newPublicationContent: string = '';
   tiles: Tile[] = [];
   utilisateurList: Utilisateur[] = [];

   ngOnInit() {
    this.getAllPublications();
   }

   public getAllPublications(){
    this.publicationService.getAllPublications().subscribe({
    next: (publications: Publication[]) => {
      console.log(publications);
      this.publicationList = publications;
      this.generateTiles(publications);
    },
    error: (error) => {
      console.error(error);
    }
  });
  }

  generateTiles(publications: Publication[]) {
    // Clear existing tiles
    this.tiles = [];

    const categoryToColor: { [key: string]: string } = {
      'afterwork': 'lightpink', // Light Blue
      'jobdating': '#303030', // Green
      'offre d\'emploi': '#ADD8E6',
      'recherche de stage':'lightyellow',
    };
    publications.forEach((publication) => {
      const color = categoryToColor[publication.categorie]
      this.tiles.push({
        text: publication.contenu,
        cols: 3, // Adjust the number of columns as per your requirement
        rows: 3, // Adjust the number of rows as per your requirement
        color: color,
        title: publication.title,
      category: publication.categorie,
      });
    });
  }
}

