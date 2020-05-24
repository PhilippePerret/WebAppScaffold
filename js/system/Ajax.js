'use strict';
class Ajax {
  /**
    @asyn
    Return une Promise
  **/
  static send(script, hdata = {}){
    Object.assign(hdata, {script: script})
    hdata = this.prepareData(hdata)
    // console.log("Data ajax : ", data)
    return new Promise((ok,ko)=>{
      var data = {
          url: 'ajax/ajax.rb'
        , data: hdata
        , success: ok
        , error: this.onError.bind(this,ko)
      }
      // console.log("Data ajax :", data)
      $.ajax(data)
    })
  }
  // On transforme toutes les données pour qu'elles respectent leur
  // type
  //    Par exemple, 12 deviendra [12,'number']
  //    "mot" deviendra ["mot",'string']
  //    Et les tables seront marquées comme 'json' et seront jsonisées
  // Cela permet de garder le type de chaque donnée
  static prepareData(h){
    for(var k in h){
      h[k] = JSON.stringify((function(value){
        switch ( typeof value ) {
          case 'string':  return [ value, 'string' ] ;
          case 'number':  return [ value, 'number'] ;//TODO ≠ entre integer et flottant
          case 'object':  return [ JSON.stringify(value), 'json']
          case 'boolean': return [ value, 'boolean']
          default: return [ value, 'undefined' ]
        }
      })(h[k]))
    }
    return h
  }
  static onError(ko, res, status, err){
    console.error("# ERREUR AJAX #")
    console.error("# err = ", err)
    console.error("# res = ", res)
    console.error("# status = ", status)
    ko()
  }
}
