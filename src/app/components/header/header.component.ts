import { Component, ViewChild, OnInit, OnDestroy, ElementRef, inject, EventEmitter } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatMenuPanel, MatMenuTrigger } from '@angular/material/menu';
import { MatSelectChange } from '@angular/material/select';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { Subscription } from 'rxjs/internal/Subscription'
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { FormRegisterComponent } from '../form-register/form-register.component';
import { FormLoginComponent } from '../form-login/form-login.component';
import { ParametreCompteComponent } from '../parametre-compte/parametre-compte.component';

import { ModalService } from 'src/app/services/modal.service';
import { HeightService } from 'src/app/services/height.service';
import { UtilisateurService } from 'src/app/services/utilisateur.service';
import { Utilisateur } from 'src/app/models/Utilisateur';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) menu!: MatMenuPanel<any>;
  @ViewChild('logoElement', { static: true }) logoElement!: ElementRef;
  isLoggedIn = false;
  accountDeleted = new EventEmitter<void>();
  private isLoggedInSubscription: Subscription | null = null;
  public utilisateur: Utilisateur | undefined;

  constructor(private dialog: MatDialog,
              public utilisateurService: UtilisateurService,
              private router: Router,
              private route: ActivatedRoute,
              private heightService: HeightService,
              private elementRef: ElementRef,
              private modalService: ModalService) {
  }

  ngOnInit(): void {
    this.heightService.setHeaderHeightSubject(this.getHeaderHeight());
    this.isLoggedInSubscription = this.utilisateurService.isLoggedIn$.subscribe((isLoggedIn: boolean) => {
    this.isLoggedIn = isLoggedIn;

    // Vous pouvez effectuer des actions supplémentaires en fonction de l'état de connexion ici
    if (isLoggedIn) {
      var href = this.router.url;
      if(href == "")
        this.router.navigate(['/home']);

      this.logoElement.nativeElement.addEventListener('click', () => {
        console.log('Logo cliqué');
      });
      this.utilisateurService.getUtilisateur(this.utilisateurService.userSession.userId ?? 0).subscribe({
        next : (utilisateur: Utilisateur) => {
          this.utilisateur = utilisateur;
        },
        error : (error: any) => {
          console.log(error);
        }
      })
    }

    });

    this.filtered = this.filterCtrl.valueChanges.pipe(
      startWith(null),
      map((filter: string | null) => (filter ? this._filter(filter) : this.allFilters.slice()))
    );

    this.route.queryParams.subscribe(params => {
      console.log(params)
      if(params['keywords'] !== undefined)
        this.filters = Array.isArray(params['keywords']) ? params['keywords'] : [params['keywords']] ;

      if(params['types'] !== undefined)
        if( !(!params['types'].includes('job_dating') && !params['types'].includes('offre_stage') && !params['types'].includes('offre_emploi') && !params['types'].includes('afterwork') && !params['types'].includes('recherche_stage') && !params['types'].includes('recherche_emploi'))){
          this.isJobDatingSelected.value = params['types'].includes('job_dating')  ? true: false;
          this.isOffreStageSelected.value = params['types'].includes('offre_stage')  ? true: false;
          this.isOffreEmploiSelected.value = params['types'].includes('offre_emploi')  ? true: false;
          this.isAfterworkSelected.value = params['types'].includes('afterwork')  ? true: false;
          this.isRechercheStageSelected.value = params['types'].includes('recherche_stage')  ? true: false;
          this.isRechercheEmploiSelected.value = params['types'].includes('recherche_emploi')  ? true: false;
      }
      
      this.codePostal = params['codePostal'] != undefined ? params['codePostal'] : this.codePostal ;
      
      if(this.codePostal !== undefined)
        this.getVille(this.codePostal);

      if(params['villes'] !== undefined)
        this.villesSelect.setValue(params['villes'].map((ville:string) => Number(ville)));

      if(params['nbRecherche'] !== undefined)
        this.nbRecherche = Number(params['nbRecherche']) + 1;
      else
        this.nbRecherche = 1;     
    
    });
  }

  ngOnDestroy(): void {
    if (this.isLoggedInSubscription) {
      this.isLoggedInSubscription.unsubscribe(); // Supprimer la souscription
    }
  }
  
  openFormRegister() {
    console.log('Open FormRegisterComponent');
    this.dialog.open(FormRegisterComponent);
  }

  openFormLogin() {
    console.log('Open FormLoginComponent');
    this.dialog.open(FormLoginComponent);
  }

  openParametreCompte() {
    console.log("Open Paramètre du compte");
    const dialogRef: MatDialogRef<ParametreCompteComponent> = this.dialog.open(ParametreCompteComponent);
    this.modalService.setDialogRef(dialogRef); // Enregistrez la référence de la modal dans le service
    console.log(this.utilisateurService.userSession.userId);
  }

  //Nettoyage token et Id user
  logoutRequest() {
    this.utilisateurService.cleanUserLogged();
    this.utilisateurService.updateIsLoggedInStatus(false); // Mettre à jour l'état de connexion
    console.log("userSession après deconnexion", this.utilisateurService.userSession)
    this.isFilterVisible = false;
    this.router.navigate(["/index"]);            //Reroutage vers index
  }

  /* AFFICHER FILTRE */
  isFilterVisible = false;

  toggleShowFilter(){
    this.isFilterVisible = !this.isFilterVisible;
    if(this.isFilterVisible && this.codePostal.length == 5){
      this.getVille(this.codePostal);
    }
  }

  /* Value Filtre */
  filters: string[] = [];
  isJobDatingSelected: any = {value : false};
  isOffreStageSelected: any = {value : false};
  isOffreEmploiSelected: any = {value : false};
  isAfterworkSelected: any = {value : false};
  isRechercheStageSelected: any = {value : false};
  isRechercheEmploiSelected: any = {value : false};
  villesSelect = new FormControl('');
  codePostal:string = "";

  /* FILTRE AVEC MOTS CLÉS */

  @ViewChild('filterInput') filterInput!: ElementRef<HTMLInputElement>;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filterCtrl = new FormControl('');
  filtered!: Observable<string[]>;

  allFilters: string[] = ['Java EE','C#','Spring boot','Angular','Javascript','CSS','PHP','Symfony'];
  announcer = inject(LiveAnnouncer);

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.filters.push(value);
    }
    event.chipInput!.clear();
    this.filterCtrl.setValue(null);
  }

  remove(filter: string): void {
    const index = this.filters.indexOf(filter);
    if (index >= 0) {
      this.filters.splice(index, 1);
      this.announcer.announce(`Removed ${filter}`);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.filters.push(event.option.viewValue);
    this.filterInput.nativeElement.value = '';
    this.filterCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allFilters.filter(filter => filter.toLowerCase().includes(filterValue));
  }

  getHeaderHeight() {
    const elementHeader = this.elementRef.nativeElement.querySelector('#header');
    return elementHeader.offsetHeight;
  }

  /*FILTRE par type */

  toggleSelectedChip(isChipSelected:any) {
    isChipSelected.value = !isChipSelected.value;
  }

  /*FILTRE avec ville */
  villes: { id: string, ville: string }[] = [];
  nbVille!:number;

  getVille(codePostal: string): void {
    if(codePostal.length == 5 )
      this.utilisateurService.getVilleByCodePostal(codePostal).subscribe({
        next: (response: any) => {
          console.log(response);
          this.villes = response.map((ville: any) => ({
            id: ville.id,
            ville: ville.ville
          }));
          this.nbVille = this.villes.length;
        },
        error: (error: any) => {
          console.error(error);
        }
      });
  }

  resetVille($event:Event){
    $event.stopPropagation();
    this.villesSelect.setValue('');
    this.codePostal = "";
    this.nbVille = 0;
    this.villes = [];
  }

  updateCodePostal($event:Event,newCodePostal:string){
    $event.stopPropagation();
    this.codePostal = newCodePostal;
    this.villesSelect.setValue('');
  }

  updateVille($event:MatSelectChange,newIdVille:string){
    this.villesSelect.setValue(newIdVille);
  }

  /* RECHERCHER */
  nbRecherche! : number;
  search(){


    //Recuperation des types de publications
   var types = [
      this.isJobDatingSelected.value ? 'job_dating' : null,
      this.isOffreStageSelected.value ? 'offre_stage' : null,
      this.isOffreEmploiSelected.value ? 'offre_emploi' : null,
      this.isAfterworkSelected.value ? 'afterwork' : null,
      this.isRechercheStageSelected.value ? 'recherche_stage' : null,
      this.isRechercheEmploiSelected.value ? 'recherche_emploi' : null
      ].filter(item => item !== null);

    /*
    { "type" :
        ['job_dating','offre_stage'],
      "keyword" :
        ['C#','Java'],
      "ville" :
        ['1']
    }
    */

    this.router.navigate(['/search'], { queryParams: {                                                  
                                                      "keywords": this.filters,
                                                      "nbRecherche" : this.nbRecherche,
                                                      "types": types,
                                                      "villes": this.villesSelect.value !== "" ? this.villesSelect.value : [],
                                                      "codePostal": this.codePostal  !== "" ? this.codePostal : null,
                                                     } });
  }

}

