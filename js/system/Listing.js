'use strict';
/**
  Class Listing
  -------------

  Version 1.0.1
  -------------

Cette classe permet de gérer des listes de chose intégralement, c'est-à-dire
aussi bien au niveau de l'affichage du listing proprement dit qu'au niveau de
la création/suppression/modification l'éléments

Cf. le manuel Listing.md qui doit toujours rester avec le module.

**/
class Listing {
  /** ---------------------------------------------------------------------
    *
    *   CLASS
    *
  *** --------------------------------------------------------------------- */
  static getNewId(){
    if (undefined === this.lastId) this.lastId = 0 ;
    ++this.lastId
    return `listing-${this.lastId}`
  }

  /** ---------------------------------------------------------------------
    *
    *   INSTANCE DE LISTING
    *
  *** --------------------------------------------------------------------- */
  constructor(owner, data){
    this.owner  = owner;
    this.data   = data ;
    this.setDefaultData()
    this.options = this.data.options ;
    this.build();
    this.filtered = false
    this.prepareOwner()
  }

  setDefaultData(){
    if ( undefined === this.data.container ) this.data.container = document.body
    // Les options par défaut
    if ( undefined === this.data.options ) this.data.options = {}
    const opts = {sortable: true, draggable: true, title: true}
    for(var opt in opts){
      if ( undefined === this.data.options[opt] ) Object.assign(this.data.options, {[opt]: opts[opt]})
    }
  }

  /**
    Méthode qui "prépare" le propriétaire du listing en lui affectant des
    méthodes utiles, par exemple 'select()' pour ses instances
  **/
  prepareOwner(){
    const my = this
    // Méthode <item>.select(<options>)
    // Si options.keep, on garde les sélections courantes.
    this.owner.prototype.select = function(options) {
      my.setSelectionTo(this, options)
    }
    // Méthode <item>.deselect()
    this.owner.prototype.deselect = function(){
      my.listing.remove(this.listingItem)
    }
    // Méthodes <owner>.selectedOne
    Object.defineProperties(this.owner, {
      'selectedOne':{
        get(){return my.returnSelectedItemIfOnlyOne.call(my)}
      }
    })
  }

  // Pour ajouter un item à la liste. +item+ doit être une instance de
  // l'élément qui répond à la méthode li() retourne le div pour l'élément
  add(item){
    var litem = new ListingItem(this, item)
    litem.appendToList()
    item.listingItem = litem
  }

  // Méthode de construction du listing
  build(){
    // Pour mettre les boutons qui devront apparaitre à la sélection d'un
    // item
    var btnsOnSelection = []

    var div = DCreate('DIV', {class:'listing', id:this.id})
    var barreTitre = DCreate('DIV',{class:'listing-barre-titre', text: this.data.titre})
    this.barreBoutons = DCreate('DIV', {class:'listing-barre-boutons'})
    this.liste  = DCreate('UL', {class:'listing-liste'})
    var form   = DCreate('FORM', {class:'listing-form'})
    this.form.build(form)
    this.barreCentrale = DCreate('DIV',{class:'listing-barre-centrale'})

    if ( this.options.title ) div.appendChild(barreTitre)

    this.barreCentrale.appendChild(this.liste)
    this.barreCentrale.appendChild(form)
    div.appendChild(this.barreCentrale)
    div.appendChild(this.barreBoutons)

    // Les boutons
    this.barreBoutons.appendChild(DCreate('BUTTON', {class:'listing-btn-save fright invisible', text:'Save'}))
    this.barreBoutons.appendChild(DCreate('BUTTON', {class:'listing-btn-init fright', text:'Init'}))
    this.barreBoutons.appendChild(DCreate('BUTTON', {class:'listing-btn-filtre fright', text:'Filtre', title:"Définir le filtre en définissant tous les champs du formulaire puis cliquer sur ce bouton."}))
    this.barreBoutons.appendChild(DCreate('BUTTON', {class:'listing-btn-plus', text:'+'}))
    this.barreBoutons.appendChild(DCreate('BUTTON', {class:'listing-btn-moins invisible', text:'−'}))
    this.barreBoutons.appendChild(DCreate('BUTTON', {class:'listing-btn-all invisible', text:'All'}))
    this.barreBoutons.appendChild(DCreate('BUTTON', {class:'listing-btn-desel-all invisible', text:'💢'}))

    // Si le propriétaire définit des boutons
    if ( this.data.buttons ) {
      this.data.buttons.forEach(dbouton => {
        const ddom = {class:[`listing-${dbouton.id}`], text: (dbouton.picto||dbouton.text)}
        if (dbouton.title){
          Object.assign(ddom, {title: dbouton.title})
        }
        if ( dbouton.on === 'selected' ) {
          // Un bouton n'apparaissant que lorsqu'il y a une sélection
          ddom.class.push('invisible')
        }
        ddom.class = ddom.class.join(' ')
        const bouton = DCreate('BUTTON', ddom)
        if ( dbouton.on == 'selected'){ btnsOnSelection.push(bouton) }
        this.barreBoutons.appendChild(bouton)
        if ( dbouton.onclick ) UI.listenClick(bouton, dbouton.onclick)
      })
    }

    // === On met l'élément dans le DOM ===
    this.data.container.appendChild(div)
    this.observe()
    this.setDimentions()

    this.buttonsOnSelection = btnsOnSelection
    this.buttonsOnSelection.push(this.btnMoins, this.btnSave)

    if ( 'function' == typeof this.owner.afterBuild) this.owner.afterBuild.call(this.owner)
  }

  observe(){

    if ( this.options.draggable ) {
      $(this.dieseId).draggable()
    } else {
      this.obj.style.position = 'relative'
      this.obj.style.boxShadow = 'none'
    }
    this.options.sortable && $(this.liste).sortable({axis:'y'})



    // Les éléments clickable
    const listeClicks = [
        [this.obj,        'activate']
      , [this.btnPlus,    'onPlusButton']
      , [this.btnMoins,   'onMoinsButton']
      , [this.btnSave,    'onSaveButton']
      , [this.btnInit,    'onInitButton']
      , [this.btnFiltre,  'onFiltreButton']
      , [this.btnAll,     'onAllButton']
    ]
    listeClicks.forEach( paire => this.listenClick.call(this, paire) )
  }
  listenClick(paire){
    var [domEl,methodName] = paire
    domEl.addEventListener('click', this[methodName].bind(this))
  }

  setDimentions(){
    if ( this.data.height ) {
      this.barreCentrale.style.height = px(this.data.height)
    }

    // Taille du formulaire
    this.data.form_width  && (this.form.obj.style.width = px(this.data.form_width))

    // Taille du listing
    this.liste.style.width  = px(this.data.list_width || 240)
    this.data.list_height && (this.liste.style.height = px(this.data.list_height))

    if ( !this.options.form_under_listing ){
      this.form.obj.style.marginLeft = px(this.data.list_width + 4)
      this.data.form_height && (this.form.obj.style.height = px(this.data.form_height - 28 - 4))
    } else {
      this.form.obj.style.height = 'auto'
    }

    if ( this.data.top ) { this.obj.style.top = px(this.data.top) }
    if ( this.data.left) { this.obj.style.left = px(this.data.left) }
  }

  activate(){
    if (this.constructor.current) this.constructor.current.desactivate()
    this.obj.style.zIndex = 500 ;
    this.constructor.current = this
    this.owner.onActivate && this.owner.onActivate.call(this.owner)
  }
  desactivate(){
    this.obj.style.zIndex = 0
  }

  // Quand il y a une sélection
  withSelection(){
    this.buttonsOnSelection.forEach(btn => this.toggleBtn(btn, true))
  }
  withoutSelection(){
    this.buttonsOnSelection.forEach(btn => this.toggleBtn(btn, false))
  }

  // Pour revenir à l'affichage de tous les éléments
  onAllButton(ev){
    this.liste.querySelectorAll('li.listing-item').forEach(li => $(li).show())
    this.toggleBtnAll(false)
    this.filtered = false
  }

  /** ---------------------------------------------------------------------
    *   PUBLIC METHODS
  *** --------------------------------------------------------------------- */

  deselectAll(){
    this.selection.removeAll()
    if ( 'function' === typeof(this.owner.onDeselectAll)) {
      this.owner.onDeselectAll.call(this.owner)
    }
  }

  // Retourne la liste ds instances propriétaire sélectionnées
  selectedItems(){
    return Array.from(this.selection.items.values()).map(litem => litem.item)
  }
  getSelection(){return this.selectedItems()} // alias

  // Retourne le dernier item sélectionné
  get lastItem(){
    if ( !this.selection.lastItem ) return ;
    return this.selection.lastItem.item
  }

  // Méthode qui retourne les items (instances de propriétaires) affichés
  // (suite au filtrage, par exemple)
  displayedItems(){
    var ary = []
    this.liste.querySelectorAll('li.listing-item').forEach(li => {
      if ($(li).is(':visible')){
        ary.push(this.owner.get(Number(li.id.split('-')[1])))
      }
    })
    return ary
  }

  setSelectionTo(liste, options){
    this.selection.setTo(liste, options)
  }

  // Pour sélectionner un élément (en fait, on simule un clic dessus)
  select(litem){
    if ('listingItem' in litem) litem = litem.listingItem
    litem.obj.scrollIntoViewIfNeeded()
    litem.onClick({shiftKey:false,metaKey:false,altKey:false})
  }

  // Retourne l'instance de l'item sélectionné mais seulement s'il n'y
  // a que lui sélectionné
  // Sinon return UNDEFINED
  returnSelectedItemIfOnlyOne(){
    let candidats = this.selectedItems()
    if ( candidats.length === 1 ) return candidats[0]
    else return ;
  }
  /** ---------------------------------------------------------------------
    *   /END PUBLIC METHODS
  *** --------------------------------------------------------------------- */

  onPlusButton(ev){
    if ( this.data.createOnPlus ) {
      // Quand on doit créer l'élément quand on clique sur "+"
      this.onSaveButton(null)
    } else {
      // Procédure normale en trois temps : 1) "+" initialisation,
      // 2) entrée des valeurs 3) "save" pour créer l'élément
      this.form.cleanup()
      this.toggleBtnSave(true)
      message("Vous pouvez créer le nouvel élément.")
    }
  }

  onMoinsButton(ev, force = false){
    const is_confirmed = force || this.options.destroy_without_confirm || confirm("Êtes-vous certain de vouloir supprimer cet élément ?")
    if ( is_confirmed ){
      const litem = this.selection.lastItem
      // console.log("litem:", litem)
      if ( 'function' == typeof this.owner.destroy ) {
        this.owner.destroy.call(this.owner, litem.item)
      } else {
        if ( undefined != this.owner.tableName ) {
          Ajax.send('system/db-remove.rb', {table:this.owner.tableName, item_id:litem.item.id})
          .then(ret => {
            onAjaxSuccess(ret)
            if(undefined!==this.owner.onDestroy)this.owner.onDestroy(litem.item)
            this.afterDestroy(litem)
          }).catch(onError)
        } else {
          if(this.owner.onDestroy)this.owner.onDestroy(litem.item)
          this.afterDestroy(litem)
        }
      }
    }
  }
  afterDestroy(litem){
    this.selection.remove(litem) // ne pas le faire avant
    litem.obj.remove()
    message("Élément supprimé avec succès.")
    this.owner.afterDestroy && this.owner.afterDestroy.call(this.owner, litem.item)
  }

  onInitButton(ev){this.form.cleanup()}

  // Quand on clique sur le bouton "Filtre"
  onFiltreButton(ev){
    // On récupère les valeurs dans le formulaire
    this.form.getValues()
    var filtreValues = []
    this.owner.PROPERTIES.forEach(dproperty => {
      if (dproperty.value) filtreValues.push([dproperty.name, String(dproperty.value)])
    })
    // console.log("Valeurs pour le filtre", filtreValues)
    var nombreLis = 0 // pour vérification
    var nombreFiltred = 0 // ceux cachés (pour bouton "all")
    this.liste.querySelectorAll('li.listing-item').forEach( li => {
      const itemId = Number(li.id.split('-')[1])
      const item = this.owner.get(itemId)
      // L'item répond-il aux exigences du filtre
      if ( this.valuesFiltreOK(item, filtreValues) ) {
        $(li).show()
      } else {
        $(li).hide()
        ++nombreFiltred
      }
      ++nombreLis
    })
    if ( nombreLis == 0) erreur("Aucun item n'a été trouvé… Êtes-vous sûr d'avoir bien ajouté la class CSS `listing-item` au LI de chaque élément (dans la méthode d'instance `li` du propriétaire) ?")
    if ( nombreFiltred ) { this.setFilterOn(true) }
  }
  valuesFiltreOK(item, filtreValues){
    var res ;
    for(var [prop, value] of filtreValues){
      if ('function' === typeof(item[`${prop}Filtre`])){
        // Si la méthode d'instance de filtrage de la propriété `prop`
        // existe, on l'utilise pour obtenir la valeur
        res = item[`${prop}Filtre`].call(item, value)
      } else {
        res = String(item[prop]) == value
      }
      if ( ! res ) { return false }
    }
    return true
  }

  // Indique que le filtre est actif (ou non)
  setFilterOn(filtred){
    if (undefined === filtred) filtred = true ;
    this.toggleBtnAll(filtred)
    this.filtered = filtred
  }

  onSaveButton(ev){
    const itemValues = this.form.checkedValues()
    if ( itemValues ){
      if ( itemValues.id ) {
        /* === ACTUALISATION === */
        if ( 'update' in this.owner ){
          itemValues.id = Number(itemValues.id)
          this.owner.update.call(this.owner, itemValues)
        } else {
          console.error("Le propriétaire doit posséder la méthode 'update', qui reçoit les nouvelles valeurs, pour pouvoir fonctionner.")
        }
      } else {
        /* === CRÉATION === */
        if ( 'function' === typeof (this.owner.create) ){
          const newItem = this.owner.create.call(this.owner, itemValues)
          this.add(newItem)
          this.owner.__afterCreate && this.owner.__afterCreate(newItem)
          this.owner.afterCreate && this.owner.afterCreate(newItem)
        } else {
          console.error("Le propriétaire doit posséder la méthode 'create', qui reçoit les nouvelles valeurs, pour pouvoir fonctionner.")
        }
      }
    } else {
      // Une erreur a été trouvée
    }
  }

  toggleBtnAll(visible){this.toggleBtn(this.btnAll,visible)}
  toggleBtnSave(visible){this.toggleBtn(this.btnSave, visible)}
  toggleBtnPlus(visible){this.toggleBtn(this.btnPlus, visible)}
  toggleBtnInit(visible){this.toggleBtn(this.btnInit, visible)}
  toggleBtnFiltre(visible){this.toggleBtn(this.btnFiltre, visible)}
  toggleBtn(btn, visible){
    btn.classList[visible?'remove':'add']('invisible')
  }

  // Gestionnaire de sélection
  get selection(){
    return this._selection || (this._selection = new ListingSelection(this))
  }
  // Gestion du formulaire
  get form(){
    return this._form || (this._form = new ListingForm(this))
  }

  get btnPlus(){return this._btnplus||(this._btnplus = this.obj.querySelector('.listing-btn-plus'))}
  get btnMoins(){return this._btnmoins||(this._btnmoins = this.obj.querySelector('.listing-btn-moins'))}
  get btnSave(){return this._btnsave||(this._btnsave = this.obj.querySelector('.listing-btn-save'))}
  get btnInit(){return this._btninit||(this._btninit = this.obj.querySelector('.listing-btn-init'))}
  get btnFiltre(){return this._btnfiltre||(this._btnfiltre = this.obj.querySelector('.listing-btn-filtre'))}
  get btnAll(){return this._btnall||(this._btnall = this.obj.querySelector('.listing-btn-all'))}

  get obj(){return this._obj || (this._obj = DGet(this.dieseId))}
  get id(){return this._id || (this._id = this.data.id || this.constructor.getNewId())}
  get dieseId(){return this._did ||(this._did = `#${this.id}`)}
}// class Listing


/** ---------------------------------------------------------------------
  *
  *   CLASS ListingItem
  *
*** --------------------------------------------------------------------- */
class ListingItem {
  constructor(listing, item){
    this.listing = listing
    this.item = item
    this.obj = item.li
    this.initClass = String(item.li.className)
  }
  appendToList(){
    this.listing.liste.appendChild(this.obj)
    this.observe()
  }
  replaceInList(){
    const newObj = this.item.li
    this.unobserve()
    this.obj.replaceWith(newObj)
    this.obj = newObj
    this.observe()
  }
  addClass(css){
    this.obj.classList.add(css)
  }
  removeClass(css){
    this.obj.classList.remove(css)
  }
  // Réinitialise l'attribut class
  resetClass() {
    this.obj.className = this.initClass
  }

  // Observation du LI d'un item de liste
  observe(){
    this.obj.addEventListener('click', this.onClick.bind(this))
  }
  unobserve(){
    this.obj.removeEventListener('click', this.onClick.bind(this))
  }

  onClick(ev){
    // console.log({
    //     'this.selected':this.selected
    //   , 'this.listing.selection.hasSeveral':this.listing.selection.hasSeveral
    //   , 'ev.shiftKey': ev.shiftKey
    //   , 'ev.altKey': ev.altKey
    // })
    if (ev.altKey) {
      // Quand on clique sur un élément par la touche ALT, c'est pour le
      // retirer de la liste filtrée. Si aucun filtre n'est encore appliqué,
      // on l'initie en retirant cet item
      $(this.obj).hide()
      this.listing.setFilterOn(true)
      // S'il était sélectionné, il faut le retirer de la sélection
      if (this.selected){
        this.listing.selection.remove(this)
        this.deselect()
      }

    } else if ( this.selected && this.listing.selection.hasSeveral && !ev.shiftKey) {
      // <= On clique sur un item déjà sélectionné alors qu'il y a plusieurs
      //    sélections et que la touche MAJ n'est pas pressée
      // => On ne doit sélectionner que cet item (et déselectionner les autres)
      this.listing.selection.set(this)
      this.select()
      this.display()
    } else {
      this.selected = !this.selected ;
      if ( this.selected ) {
        this.select()
        if ( ev.shiftKey ) {
          // La touche majuscule est pressée => On ajoute à la sélection
          this.listing.selection.add(this)
        } else {
          // La touche majuscule n'est pas pressée => On met la sélection à ça
          this.listing.selection.set(this)
          this.display()
        }
      } else {
        this.deselect()
        this.listing.selection.remove(this)
      }
    }
  }

  // Pour afficher les valeurs de l'item dans la partie droite
  display(){
    this.listing.form.feed(this.item)
  }
  select(){
    this.addClass('selected')
  }
  deselect(){
    this.resetClass()
  }
  get id(){return this.item.id}
}

/** ---------------------------------------------------------------------
  *   Class ListingSelection
  *   ----------------------
  *   Gestion de la sélection
  *
*** --------------------------------------------------------------------- */
class ListingSelection {
  constructor(listing /* instance Listing */){
    this.listing = listing;
    this.items = new Map()
  }

  get hasOnlyOne(){return this.items.size == 1 }
  get hasSeveral(){return this.items.size > 1}
  get hasNone(){return this.items.size == 0}

  // Ajoute le ListingItem +litem+ à la sélection
  add(litem){
    this.items.set(litem.id, litem)
    litem.selected = true
    this.listing.withSelection()
    // Appeler la méthode du propriétaire si elle existe
    if (this.listing.data.onSelect){
      this.listing.data.onSelect(litem.item)
    } else if (this.listing.owner.onSelect) {
      this.listing.owner.onSelect(litem.item)
    }
  }
  // Met la sélection à l'item de liste +litem+
  set(litem){
    this.removeAll()
    this.add(litem)
  }
  // Retire l'item +litem+ de la sélection
  remove(litem){
    this.items.delete(litem.id)
    litem.deselect()
    if ( this.listing.data.onDeselect ) {
      this.listing.data.onDeselect(litem.item)
    } else if ( this.listing.owner.onDeselect ) {
      this.listing.owner.onDeselect(litem.item)
    }
    litem.selected = false
  }
  // Retourne toutes les sélections
  removeAll(){
    this.items.forEach(litem => this.remove(litem))
    this.listing.withoutSelection()
    this.items = new Map()
  }
  deselectAll(){return this.removeAll()}// alias
  // Retourne le dernier item sélectionné (ou undefined)
  get lastItem(){
    if ( !this.items || this.items.size == 0 ) return ;
    return Array.from(this.items)[this.items.size-1][1]
  }

  // Appelé par la méthode publique 'Listing#setSelectionTo'
  // Cf. le manuel Listing.md
  setTo(liste, options = {}){
    var item  // instance de propriétaire
      , litem // ListingItem
      , css   // Class optionnelle à ajouter
      ;
    if ( ! options.keep ) { this.removeAll() }
    if ( Array.isArray(liste)) {
      liste.forEach( designant => {
        css = 'selected'
        if ( Array.isArray(designant)) {
          // L'élément est : [<désignant item>, <class CSS>]
          [designant, css] = designant
        }
        if ( 'number' == typeof(designant)) {
          // L'élément est un identifiant
          item = this.listing.owner.get(designant)
        } else {
          // L'élément est une instance de propriétaire
          item = designant
        }
        litem = item.listingItem
        this.add(litem)
        litem.obj.classList.add(css)
      })
    } else {
      if ( 'number' == typeof(liste) ) item = this.listing.owner.get(liste)
      else item = liste
      litem = item.listingItem
      this.add(litem)
      litem.select()
    }
  }
}

/** ---------------------------------------------------------------------
  *
  *   Class ListingForm
  *   -----------------
  *   Gestion du formulaire (propriété `form` du listing)
  *
*** --------------------------------------------------------------------- */
class ListingForm {

  constructor(listing){
    this.listing = listing;
  }

  forEachField(method){
    this.properties.forEach(dproperty => {
      const field = this.obj.querySelector(`#item-${dproperty.name}`)
      if ( dproperty.type == 'checkbox' ) field.isCheckbox = true ;
      method(field, dproperty)
    })
  }
  feedField(item, field, dprop){
    const value = item.data[dprop.name]
    if ( dprop.type == 'checkbox'){
      field.checked = value
    } else {
      field.value = value
    }
    if (dprop.setter){ this.listing.owner[dprop.setter].call(this.listing.owner,value)}
  }

  // Remplir le formulaire avec les valeurs de l'item +item+
  feed(item){
    this.obj.querySelector('.span-id').innerHTML = `#${item.id}`
    this.obj.querySelector('#item-id').value = item.id
    this.forEachField(this.feedField.bind(this,item))
  }

  cleanup(){
    this.obj.querySelector('.span-id').innerHTML = '&nbsp;'
    this.obj.querySelector('#item-id').value = ''
    this.forEachField((field, dprop) => {
      if ( field.isCheckbox ) field.checked = false
      else { field.value = dprop.default || "" }
    })
    // Par défaut on décoche toutes les case à cocher
    this.obj.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false)
    this.listing.owner.afterInitForm && this.listing.owner.afterInitForm()
  }

  /**
    Vérification des données du formulaire
  **/
  checkedValues(){
    let errors = []
      , onlyValues = {} // pour ne mettre que les propriétés et les valeurs
      , firstFocusSet = false // pour savoir si on a focussé dans le premier champ
      ;
    this.getValues()
    // console.log("this.properties:", this.properties)
    this.properties.forEach(dproperty => {

      // Débug
      // console.log("Check property #%s : %s", dproperty.name, dproperty.value)

      let error = null
      var value = dproperty.value
      switch(dproperty.vtype){
        case 'number': value = Number(value); break
      }
      if ( dproperty.required && value === null ) {
        error = `La propriété #${dproperty.name} est absolument requise.`
      }
      if ( dproperty.max ) {
        if ( dproperty.vtype == 'number' && value > dproperty.max) {
          error = `La propriété #${dproperty.name} a une valeur trop grande (max : ${dproperty.max}).`
        } else if ( value.length > dproperty.max ) {
          error = `La propriété #${dproperty.name} est trop longue (max : ${dproperty.max}).`
        }
      }
      if ( dproperty.min ) {
        if ( dproperty.vtype == 'number' && value < dproperty.min) {
          error = `La propriété #${dproperty.name} a une valeur trop petite (min : ${dproperty.min}).`
        } else if ( value.length < dproperty.min ) {
          error = `La propriété #${dproperty.name} est trop courte (min : ${dproperty.min}).`
        }
      }

      const row = this.obj.querySelector(`.row-${dproperty.name}`)
      let div_message;
      if (row){
        div_message = row.querySelector(`.error-message`)
      } else {
        console.warn(`Pas de rangée .row-${dproperty.name}” dans le formulaire. Impossible de mettre en exergue l'erreur.`)
      }
      if (error) {
        errors.push(error)
        if(row){
          row.classList.add('field-error')
          div_message.innerHTML = error
          $(div_message).show()
        }
        if (!firstFocusSet){
          firstFocusSet = true
          this.obj.querySelector(`#item-${dproperty.name}`).focus()
        }
      } else {
        // Tout est OK, on peut la prendre
        if ( row ) {
          row.classList.remove('field-error') // s'il y avait une erreur
          $(div_message).hide()
        }
        Object.assign(onlyValues, {[dproperty.name]: value})
      }
    })// fin de boucle sur toutes les propriétés

    // On ajoute l'identifiant, qui ne sera utilisé que si c'est une
    // édition
    var itemId = this.obj.querySelector('#item-id').value
    if (itemId == '') itemId = undefined
    else itemId = Number(itemId)
    Object.assign(onlyValues, {id: itemId})

    // console.log("onlyValues = ", onlyValues)

    if ( errors.length ) { return null }
    else { return onlyValues }
  }

  /**
    Méthode qui récupère les données du formulaire et les ajoute
    à la variable `properties` dans l'attribut `value`
  **/
  getValues(){
    this.properties.forEach(dproperty => {
      const field = this.obj.querySelector(`#item-${dproperty.name}`)
      let value ;
      if (dproperty.getter){
        value = this.listing.owner[dproperty.getter].call(this.listing.owner)
      } else {
        if ( dproperty.type == 'checkbox' ) { value = field.checked === true }
        else { value = field.value }
        if ( value === '' ) value = null
      }
      // console.log("dproperty.name: '%s', value: %s", dproperty.name, value)
      dproperty.value = value
    })
  }

  /**
    Construction du formulaire en fonction de la définition des
    propriétés du propriétaire du listing.


  **/
  /* ListingForm */build(container){
    // Pour mettre l'identifiant en cas d'édition
    var css = ['right', 'span-id']
    if(this.listing.options.no_id) css.push('hidden')
    container.appendChild(DCreate('DIV',{class:css.join(' '), text:'&nbsp;'}))
    container.appendChild(DCreate('INPUT',{type:'hidden',id:'item-id',value:''}))

    this.properties.forEach(dproperty => {
      dproperty.options || (dproperty.options = {})
      // console.log("dproperty = ", dproperty)
      var tag  = 'DIV'
      if ( dproperty.options.inline ) tag = 'SPAN'
      var div   = DCreate(tag, {class:`row row-${dproperty.name}`})
      const fid = `item-${dproperty.name}`
      if ( dproperty.hname ) {
        div.appendChild(DCreate('LABEL', {text: dproperty.hname}))
      }
      switch (dproperty.type) {
        case 'textarea':
          div.appendChild(DCreate('TEXTAREA',{id: fid})); break;
        case 'hidden':
          div.appendChild(DCreate('INPUT', {type:'hidden', id:fid})); break;
        case 'checkbox':
          div.appendChild(DCreate('SPAN', {inner:[
              DCreate('INPUT', {type:'checkbox', id:fid})
            , DCreate('LABEL', {for:fid, text:dproperty.label})
          ]}))
          break
        default:
          var inputData = {type:'text', id:fid}
          if (dproperty.placeholder) Object.assign(inputData,{placeholder: dproperty.placeholder})
          if ( dproperty.options.field_width )Object.assign(inputData,{style:`width:${dproperty.options.field_width}`})
          div.appendChild(DCreate('INPUT', inputData))
      }
      // Si la propriété définit une méthode particulière de construction,
      // on l'appelle
      if ( dproperty.form ) {
        div = this.listing.owner[dproperty.form].call(this.listing.owner, div)
      }
      // On ajoute un champ invisible pour mettre les messages d'erreur
      div.appendChild(
        DCreate('DIV',{class:'error-message hidden'})
      )
      // On l'ajoute au container général
      container.appendChild(div)
    })
    return container
  }

  get obj(){return this._obj || (this._obj = this.listing.obj.querySelector('form.listing-form'))}
  get properties(){
    return this._properties ||(this._properties = this.listing.owner.PROPERTIES)
  }
}
