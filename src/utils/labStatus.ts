/**
 * De los 16 escenarios del catálogo offline incluido en NetPhantom
 * (src/data/defaultScenarios.ts), solo FSOCIETY_E_CORP_01 tiene un
 * provisionScript/Dockerfile que realmente instala y arranca un servicio
 * vulnerable. Los otros 15 son plantillas narrativas (story, hints,
 * topología...) cuyo contenedor solo levanta `debian:12-slim` con una
 * shell inactiva: no hay nada que explotar dentro.
 *
 * Esta lista permite avisar de ello en la UI sin inventar laboratorios
 * nuevos. Deliberadamente NO se usa para escenarios generados por Gemini
 * ni importados: esos pueden ser legítimamente funcionales o no, y no
 * podemos saberlo sin ejecutarlos.
 */
const TEMPLATE_ONLY_PRESET_CODENAMES = new Set([
  'NEBUCHADNEZZAR_01',
  'KAER_MORHEN_01',
  'UMBRELLA_HIVE_01',
  'TYRELL_NEXUS_01',
  'WEYLAND_NOSTROMO_01',
  'MORDOR_RELAY_01',
  'HAWKINS_GATE_01',
  'ARASAKA_ICE_BREAK_01',
  'LUMON_MDR_TERMINAL_01',
  'LOS_POLLOS_HERMANOS_01',
  'CALTECH_SHELDON_CLUSTER_01',
  'DHARMA_SWAN_STATION_108',
  'FBI_XFILES_ARCHIVE_01',
  'RED_KEEP_LITTLE_BIRDS_01',
  'PIED_PIPER_MIDDLE_OUT_01',
]);

export function isTemplateOnlyPreset(codename: string | undefined | null): boolean {
  if (!codename) return false;
  return TEMPLATE_ONLY_PRESET_CODENAMES.has(codename.toUpperCase());
}
