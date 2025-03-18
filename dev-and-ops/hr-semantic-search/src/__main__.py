import json 
import click 
import requests

from dotenv import load_dotenv
from src.settings.credential import CredentialSettings
from src.log import logger 

from os import path 
from glob import glob 

from typing import List, Tuple, Dict 


from hashlib import sha256

from enum import Enum 

class EmbeddingInputType(str, Enum):
    SEARCH_DOCUMENT:str='search_document'
    SEARCH_QUERY:str='search_query'
    CLUSTERING:str='clustering'
    CLASSIFICATION:str='classification'
    IMAGE:str='image'

class EmbeddingModel(str, Enum):
    ENGLISH_ONLY_LIGHT:str='embed-english-light-v3.0'
    MULTILINGUAL_LIGHT:str='embed-multilingual-light-v3.0'
    ENGLISH_ONLY_HEAVY:str='embed-english-v3.0'
    MULTILINGUAL_HEAVY:str='embed-multilingual-v3.0'


@click.group(chain=False, invoke_without_command=True)
@click.option('--service_url', '-u', envvar='SERVICE_URL', required=True)
@click.pass_context
def handler(ctx:click.core.Context, service_url:str):
    ctx.ensure_object(dict)
    ctx.obj['settings'] = {
        'service_url': service_url,
        'credential': CredentialSettings()
    }

@handler.command()
@click.option('--index', '-i', type=str, help='index name', required=True)
@click.option('--path2config_json', '-p', required=True, type=click.Path(exists=True, dir_okay=False))
@click.pass_context
def create_index(ctx:click.core.Context, index:str, path2config_json:str):
    with open(file=path2config_json, mode='r') as file_pointer:
        index_mappings_settings = json.load(file_pointer)

    print(json.dumps(index_mappings_settings, indent=2))
    service_url = ctx.obj['settings']['service_url']
    
    res = requests.post(
        url=path.join(service_url, f'v1/index/{index}'),
        json=index_mappings_settings
    )

    try:
        res.raise_for_status()
        result = res.json()
        print(result)
    except Exception as e:
        logger.error(e)


@handler.command()
@click.option('--index', '-i', type=str, help='index name', required=True)
@click.option('--path2corpus', '-p' ,type=click.Path(exists=True, file_okay=False))
@click.pass_context
def fill_index(ctx:click.core.Context, index:str, path2corpus:str):
    service_url = ctx.obj['settings']['service_url']
    file_paths:List[str] = sorted(glob(path.join(path2corpus, '*.pdf')))

    target_json_schema = {
        "title": {
            "type": "string",
            "description": "The main title of the content",
            "required": True
        },
        "profile": {
            "type": "object",
            "description": "Personal information of the individual",
            "properties": {
                "first_name": {
                    "type": "string",
                    "description": "First name of the person",
                    "required": True
                },
                "last_name": {
                    "type": "string",
                    "description": "Last name of the person",
                    "required": True
                },
                "tel_num": {
                    "type": "string",
                    "description": "Contact telephone number",
                    "pattern": "Phone number in any standard format",
                    "required": False
                },
                "email": {
                    "type": "string",
                    "description": "Email address",
                    "pattern": "Valid email format",
                    "required": False
                }
            }
        },
        "summary": {
            "type": "string",
            "description": "A concise summary of the main content",
            "required": True
        },
        "question_answer": {
            "type": "array",
            "description": "List of question and answer pairs",
            "items": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The question text"
                    },
                    "answer": {
                        "type": "string",
                        "description": "The answer text"
                    }
                }
            },
            "required": False
        },
        "example_queries": {
            "type": "array",
            "description": "List of semantic search queries(that highlight the candidate skills, profile) that a user may enter to find this candidate using embedding similarity",
            "items": {
                "type": "string"
            },
            "required": False
        },
        "topics": {
            "type": "array",
            "description": "List of relevant topics or categories",
            "items": {
                "type": "string"
            },
            "required": False
        }
    }

    for path2file in file_paths[:32]: 
        # pdf to text
        with open(file=path2file, mode='rb') as fp:
            res = requests.post(url=path.join(service_url, 'v1/tools/convert_pdf2text'), files={'file': fp})

        try:
            res.raise_for_status()
            result = res.json()
            text = "\n".join(result['pages']) 
            print(text[:50])
        except Exception as e:
            logger.error(e)
            continue
        
        job = """
            # Ingénieur Deep Learning & Image Processing

## À propos du poste
Nous recherchons un(e) ingénieur(e) talentueux(se) spécialisé(e) en deep learning et traitement d'images pour rejoindre notre équipe R&D. Le candidat idéal associera une expertise technique pointue en deep learning à une solide expérience en optimisation GPU et conteneurisation.

## Responsabilités principales
- Concevoir et développer des solutions innovantes de traitement d'images basées sur le deep learning
- Optimiser les performances des modèles sur GPU en utilisant CUDA
- Implémenter des pipelines de traitement distribué avec ZeroMQ
- Conteneuriser les applications avec Docker pour faciliter le déploiement
- Collaborer avec les équipes produit pour l'intégration des solutions
- Assurer une veille technologique active dans le domaine

## Compétences techniques requises
### Deep Learning & Computer Vision
- Maîtrise des frameworks de deep learning (PyTorch, TensorFlow)
- Expertise en traitement d'images et computer vision
- Expérience pratique avec les architectures CNN, transformers et detection/segmentation
- Connaissance approfondie des techniques d'optimisation de modèles

### Développement & Optimisation
- Expertise en programmation CUDA pour l'accélération GPU
- Maîtrise de Python et C++
- Expérience avec ZeroMQ pour la communication distribuée
- Pratique de Docker et des outils de conteneurisation
- Bonnes pratiques de versioning (Git) et CI/CD

### Compétences additionnelles appréciées
- Expérience avec Kubernetes
- Connaissance des plateformes cloud (AWS, GCP, Azure)
- Contributions à des projets open source
- Publications scientifiques dans le domaine

## Formation & Expérience
- Master ou Doctorat en Computer Science, Machine Learning ou domaine connexe
- Minimum 5 ans d'expérience professionnelle en deep learning
- Portfolio de projets démontrant une expertise en traitement d'images

## Qualités personnelles
- Forte capacité d'analyse et de résolution de problèmes
- Excellentes aptitudes en communication technique
- Autonomie et prise d'initiative
- Esprit d'équipe et collaboration
- Passion pour l'innovation technologique

## Environnement de travail
- Équipe internationale et dynamique
- Projets innovants à fort impact
- Infrastructure de calcul GPU dernière génération
- Possibilité de télétravail partiel
- Formation continue et participation à des conférences
        """
        # text to json 
        res = requests.post(
            url=path.join(service_url, 'v1/tools/convert_doc2json'),
            json={
                'text': f"cv: {text}### job : {job}",
                'target_json_schema': {
                    "score": {
                        "type": "array of object where each object is {'domain': 'string', 'value': 'float'}",
                        "description": "semantic score matching job/candidate entre 0 et 1"
                    },
                    "justification":{
                        "type": "string",
                        "description": "justification du score de matching"
                    }
                },  
                'extraction_steps': 'analyze the input text, fill all fields, output-language: FRENCH!!!',
                'model': 'gpt-4o'
            }
        )

        try:
            res.raise_for_status()
            result = res.json()
            print(json.dumps(result['data'], indent=3))
        except Exception as e:
            logger.error(e)
            continue
        
        metadata = result['data']
        # embedding 
        res = requests.post(
            url=path.join(service_url, 'v1/embedding/text'),
            json={
                'texts': [json.dumps(result['data'])],
                'model': EmbeddingModel.MULTILINGUAL_HEAVY,
                'input_type': EmbeddingInputType.SEARCH_DOCUMENT
            }
        )

        try:
            res.raise_for_status()
            result = res.json()
            print(result['embeddings'][0][:10])
        except Exception as e:
            logger.error(e)
            continue

        
        # build metadata 
        metadata['embedding'] = result['embeddings'][0]
        # send metadata to the index 

        document_id = sha256(text.encode()).hexdigest()
        res = requests.post(
            url=path.join(service_url, f'v1/index/{index}/document/{document_id}'),
            json={
                'structured_doc': metadata
            }
        )

        try:
            res.raise_for_status()
            result = res.json()
            print(result)
        except Exception as e:
            logger.error(e)
            continue




if __name__ == '__main__':
    load_dotenv()
    handler()