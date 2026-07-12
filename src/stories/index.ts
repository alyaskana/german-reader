import type { Story } from '../lib/types'
import imCafe from './im-cafe.json'
import mitDerUBahn from './mit-der-u-bahn.json'
import imSupermarkt from './im-supermarkt.json'
import neueNachbarn from './neue-nachbarn.json'
import einSonntagImPark from './ein-sonntag-im-park.json'
import beimArzt from './beim-arzt.json'
import hausschuhe from './hausschuhe.json'
import dasLangeFruehstueck from './das-lange-fruehstueck.json'
import derGrillPlan from './der-grill-plan.json'
import versicherung from './versicherung.json'
import keinSchlechtesWetter from './kein-schlechtes-wetter.json'
import sprichDeutsch from './sprich-deutsch.json'
import denglisch from './denglisch.json'
import derRoteMann from './der-rote-mann.json'
import apfelsaftschorle from './apfelsaftschorle.json'
import dieMischung from './die-mischung.json'

export const stories: Story[] = [
  // Wie man Deutscher wird — истории про немецкую культуру (сериал про Тома)
  hausschuhe,
  dasLangeFruehstueck,
  derGrillPlan,
  versicherung,
  keinSchlechtesWetter,
  sprichDeutsch,
  denglisch,
  derRoteMann,
  apfelsaftschorle,
  dieMischung,
  // повседневные истории
  imCafe,
  mitDerUBahn,
  imSupermarkt,
  neueNachbarn,
  einSonntagImPark,
  beimArzt,
]
