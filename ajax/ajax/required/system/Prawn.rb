require 'prawn'

# Reçoit des millimètres et les convertit en point (l'unité de prawn)
# 2 décimales
def mm2pt millimetres
  (100 * (millimetres.to_f * 2.834645669291339)).to_f / 100
end

# def try_pdf_document
#   # require DATA_PERSO_PATH
#   # require File.join(APP_FOLDER,'data','modeles','lettre','textes')
#   dsociete  = db_get('societes', {id: 1})
#   dprojet   = db_get('projets', {id: 1})
#
#
#   size = [mm2pt(426), mm2pt(302)] # pour LULU
#   data_document = {page_size: size, page_layout: :portrait}
#   Prawn::Document.generate("pour-essai-prawn.pdf", data_document) do
#     # Pour voir les axes
#     # stroke_axis
#
#     # font "#{APP_FOLDER}/data/fonts/unicode.optima.ttf"
#     # font "#{APP_FOLDER}/data/fonts/Optima.ttf"
#     # font "Times-Roman"
#     font_prefix = "#{APP_FOLDER}/data/fonts/"
#     font_families.update("Avenir" => {
#       # :normal => "#{font_prefix}/AvenirNextW1G-Regular.ttf",
#       # :italic => "#{font_prefix}/AvenirNextW1G-Italic.ttf",
#       # :bold => "#{font_prefix}/AvenirNextW1G-Bold.ttf",
#       :normal => "#{font_prefix}/Univers_Fonts/Univers-light-normal.ttf",
#       :italic => "#{font_prefix}/Univers_Fonts/Univers-light-italic.ttf",
#       :bold => "#{font_prefix}/Univers_Fonts/Univers-black-normal.ttf",
#     })
#     font "Avenir"
#
#
#     margin_left = 640
#
#     # Boite coordonnées auteur
#     bounding_box([margin_left, 750], width:300, height:80) do
#       text "Philippe Perret"
#       text ADRESSE + RC + TELEPHONE
#     end
#
#     # MAISON D'ÉDITION
#     # ----------------
#     # Boite pour mettre l'adresse de la maison d'édition
#     # bounding_box([200,400], width:200, heigth:80) do
#     bounding_box([880,700], width:200, heigth:80) do
#       text dsociete[:adresse]
#     end
#
#     # Boite "à VILLE, le DATE"
#     bounding_box([800,580], width:1100-800, height: 40) do
#       text "à #{VILLE}, le #{date_humaine(Time.now)}", style: :italic
#     end
#
#     # Boite message + Signature
#     mleft_msg = margin_left+40
#     bounding_box([mleft_msg,540], width:1100-mleft_msg, height: 600) do
#       # stroke_bounds
#       text INVITE + RC2
#       text TEXTE_TYPE % {TITRE: dprojet[:titre]}
#       text RC + SIGNATURE
#     end
#   end
# end
