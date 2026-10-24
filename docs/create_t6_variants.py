#!/usr/bin/env python3
"""
Génère les 4 fichiers .fet variants T6 à partir de isamk.fet :
- isamk_T6_100.fet : Preferred Room peeka pour M2-CI, poids 100%
- isamk_T6_90.fet  : Preferred Room peeka pour M2-CI, poids 90%
- isamk_T06_100.fet: Preferred Room peeka pour M2-CI, poids 100% (nom contrainte différent)
- isamk_T06_90.fet : Preferred Room peeka pour M2-CI, poids 90% (nom contrainte différent)
"""

import xml.etree.ElementTree as ET
import copy

INPUT_FILE = "/home/mehdi/dev/isamk-takt/docs/isamk.fet"
OUTPUT_FILES = {
    "isamk_T6_100.fet": (100, "T6_100"),
    "isamk_T6_90.fet": (90, "T6_90"),
    "isamk_T06_100.fet": (100, "T06_100"),
    "isamk_T06_90.fet": (90, "T06_90"),
}

# Parse le fichier original
tree = ET.parse(INPUT_FILE)
root = tree.getroot()

# Trouver la liste des contraintes temporelles
time_constraints_list = root.find("Time_Constraints_List")
if time_constraints_list is None:
    raise ValueError("Time_Constraints_List non trouvé")

# Fonction pour créer une contrainte Preferred Room
def create_preferred_room_constraint(weight, tag_suffix):
    constraint = ET.Element("ConstraintStudentsPreferredRoom")
    
    weight_elem = ET.SubElement(constraint, "Weight_Percentage")
    weight_elem.text = str(weight)
    
    students_elem = ET.SubElement(constraint, "Students")
    students_elem.text = "M2-CI"
    
    room_elem = ET.SubElement(constraint, "Room")
    room_elem.text = "peeka"
    
    active_elem = ET.SubElement(constraint, "Active")
    active_elem.text = "true"
    
    comments_elem = ET.SubElement(constraint, "Comments")
    comments_elem.text = f"Test T6 - Preferred Room peeka pour M2-CI ({tag_suffix})"
    
    return constraint

# Générer chaque variant
for output_file, (weight, tag_suffix) in OUTPUT_FILES.items():
    # Copier l'arbre original
    new_tree = copy.deepcopy(tree)
    new_root = new_tree.getroot()
    new_time_constraints = new_root.find("Time_Constraints_List")
    
    # Ajouter la contrainte Preferred Room
    constraint = create_preferred_room_constraint(weight, tag_suffix)
    new_time_constraints.append(constraint)
    
    # Écrire le fichier
    output_path = f"/home/mehdi/dev/isamk-takt/docs/{output_file}"
    # Pretty print
    from xml.dom import minidom
    rough_string = ET.tostring(new_root, encoding="unicode")
    reparsed = minidom.parseString(rough_string)
    pretty_xml = reparsed.toprettyxml(indent="  ", encoding="UTF-8")
    
    with open(output_path, "wb") as f:
        f.write(pretty_xml)
    
    print(f"✅ Créé : {output_path} (poids={weight}%, tag={tag_suffix})")

print("\nTous les variants T6 créés avec succès !")