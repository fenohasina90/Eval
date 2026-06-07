/**
 * Page Exemple - Démonstration de tous les composants réutilisables
 * avec tous leurs props et variantes
 */
import { useState } from 'react'
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Badge,
  Modal,
  Checkbox,
  H1, H2, H3, H4, P, Small, Label,
  Table, Thead, Tbody, Tr, Th, Td,
} from '../components'

export default function Exemple() {
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [isChecked, setIsChecked] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  return (
    <div className="max-w-4xl mx-auto space-y-12">

      {/* ─── Typographie ─── */}
      <section className="space-y-4">
        <H2 className="border-b border-gray-200 pb-2">Typographie</H2>
        <div className="space-y-3">
          <H1>Heading 1 - Titre principal</H1>
          <H2>Heading 2 - Sous-titre</H2>
          <H3>Heading 3 - Section</H3>
          <H4>Heading 4 - Sous-section</H4>
          <P>
            Paragraphe - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </P>
          <Small>Small - Texte secondaire ou note de bas de page</Small>
        </div>
      </section>

      {/* ─── Boutons ─── */}
      <section className="space-y-4">
        <H2 className="border-b border-gray-200 pb-2">Boutons</H2>

        <div>
          <P className="mb-2 font-medium text-gray-800">Variantes :</P>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setClickCount(c => c + 1)}>
              Primary ({clickCount})
            </Button>
            <Button variant="secondary" onClick={() => alert('Secondary cliqué')}>
              Secondary
            </Button>
            <Button variant="outline" onClick={() => alert('Outline cliqué')}>
              Outline
            </Button>
            <Button variant="danger" onClick={() => alert('Danger cliqué')}>
              Danger
            </Button>
            <Button variant="ghost" onClick={() => alert('Ghost cliqué')}>
              Ghost
            </Button>
          </div>
        </div>

        <div>
          <P className="mb-2 font-medium text-gray-800">Tailles :</P>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        <div>
          <P className="mb-2 font-medium text-gray-800">États :</P>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>Outline Disabled</Button>
          </div>
        </div>
      </section>

      {/* ─── Cards ─── */}
      <section className="space-y-4">
        <H2 className="border-b border-gray-200 pb-2">Cards</H2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <Card.Header><H4>Default</H4></Card.Header>
            <Card.Body><P>Card avec bordure standard.</P></Card.Body>
            <Card.Footer>
              <Button size="sm" variant="ghost">Action</Button>
            </Card.Footer>
          </Card>

          <Card variant="bordered">
            <Card.Header><H4>Bordered</H4></Card.Header>
            <Card.Body><P>Card avec bordure accentuée.</P></Card.Body>
            <Card.Footer>
              <Button size="sm" variant="ghost">Action</Button>
            </Card.Footer>
          </Card>

          <Card variant="elevated" onClick={() => alert('Card cliquée !')}>
            <Card.Header><H4>Elevated (cliquable)</H4></Card.Header>
            <Card.Body><P>Card avec ombre, cliquable via onClick.</P></Card.Body>
            <Card.Footer>
              <Button size="sm" variant="ghost">Action</Button>
            </Card.Footer>
          </Card>
        </div>
      </section>

      {/* ─── Formulaires ─── */}
      <section className="space-y-4">
        <H2 className="border-b border-gray-200 pb-2">Formulaires</H2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="input-default">Input (onChange)</Label>
              <Input
                id="input-default"
                placeholder="Tapez quelque chose..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Small>Valeur actuelle : "{inputValue}"</Small>
            </div>

            <div>
              <Label htmlFor="input-error">Input erreur</Label>
              <Input
                id="input-error"
                variant="error"
                placeholder="Champ invalide"
                defaultValue="valeur incorrecte"
              />
            </div>

            <div>
              <Label htmlFor="input-disabled">Input désactivé</Label>
              <Input
                id="input-disabled"
                disabled
                value="Non modifiable"
              />
            </div>

            <div>
              <Label htmlFor="input-sizes">Tailles Input</Label>
              <div className="space-y-2">
                <Input size="sm" placeholder="Small" />
                <Input size="md" placeholder="Medium" />
                <Input size="lg" placeholder="Large" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="select-demo">Select (onChange)</Label>
              <Select
                id="select-demo"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
              >
                <option value="">Choisir...</option>
                <option value="react">React</option>
                <option value="vue">Vue</option>
                <option value="angular">Angular</option>
              </Select>
              <Small>Sélection : "{selectValue}"</Small>
            </div>

            <div>
              <Label htmlFor="textarea-demo">Textarea (onChange)</Label>
              <Textarea
                id="textarea-demo"
                rows={4}
                placeholder="Écrivez votre message..."
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
              />
              <Small>{textareaValue.length} caractères</Small>
            </div>

            <div>
              <Checkbox
                label="J'accepte les conditions"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
              <Small className="block mt-1">
                Coché : {isChecked ? 'Oui' : 'Non'}
              </Small>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Badges ─── */}
      <section className="space-y-4">
        <H2 className="border-b border-gray-200 pb-2">Badges</H2>
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="success">Succès</Badge>
          <Badge variant="warning">Attention</Badge>
          <Badge variant="danger">Erreur</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="success" onClick={() => alert('Badge cliqué !')} className="cursor-pointer hover:opacity-80">
            Cliquable
          </Badge>
        </div>
      </section>

      {/* ─── Table ─── */}
      <section className="space-y-4">
        <H2 className="border-b border-gray-200 pb-2">Table</H2>
        <Table>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Nom</Th>
              <Th>Email</Th>
              <Th>Statut</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr onClick={() => alert('Ligne 1 cliquée')} className="cursor-pointer">
              <Td>1</Td>
              <Td className="font-medium text-gray-900">Jean Dupont</Td>
              <Td>jean@exemple.fr</Td>
              <Td><Badge variant="success">Actif</Badge></Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); alert('Éditer Jean'); }}>
                  Éditer
                </Button>
              </Td>
            </Tr>
            <Tr onClick={() => alert('Ligne 2 cliquée')} className="cursor-pointer">
              <Td>2</Td>
              <Td className="font-medium text-gray-900">Marie Martin</Td>
              <Td>marie@exemple.fr</Td>
              <Td><Badge variant="warning">En attente</Badge></Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); alert('Éditer Marie'); }}>
                  Éditer
                </Button>
              </Td>
            </Tr>
            <Tr onClick={() => alert('Ligne 3 cliquée')} className="cursor-pointer">
              <Td>3</Td>
              <Td className="font-medium text-gray-900">Pierre Bernard</Td>
              <Td>pierre@exemple.fr</Td>
              <Td><Badge variant="danger">Inactif</Badge></Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); alert('Éditer Pierre'); }}>
                  Éditer
                </Button>
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </section>

      {/* ─── Modal ─── */}
      <section className="space-y-4">
        <H2 className="border-b border-gray-200 pb-2">Modal</H2>
        <Button onClick={() => setShowModal(true)}>Ouvrir Modal</Button>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Exemple de Modal"
        >
          <P className="mb-4">
            Ceci est un modal réutilisable. Il supporte un titre, du contenu libre,
            et un bouton de fermeture.
          </P>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button onClick={() => { alert('Confirmé !'); setShowModal(false); }}>
              Confirmer
            </Button>
          </div>
        </Modal>
      </section>

      {/* ─── Props natifs ─── */}
      <section className="space-y-4">
        <H2 className="border-b border-gray-200 pb-2">Props natifs HTML</H2>
        <Card>
          <Card.Body className="space-y-3">
            <P>Chaque composant accepte tous les props natifs de son élément HTML :</P>

            <div>
              <Label>onFocus / onBlur :</Label>
              <Input
                placeholder="Focus / Blur test"
                onFocus={() => console.log('Input focused')}
                onBlur={() => console.log('Input blurred')}
              />
            </div>

            <div>
              <Label>onMouseEnter / onMouseLeave :</Label>
              <Button
                onMouseEnter={() => console.log('Mouse enter')}
                onMouseLeave={() => console.log('Mouse leave')}
              >
                Survolez-moi (voir console)
              </Button>
            </div>

            <div>
              <Label>data-*, aria-*, id, title :</Label>
              <Button
                id="btn-custom"
                title="Tooltip natif"
                data-testid="custom-button"
                aria-label="Bouton personnalisé"
                variant="outline"
              >
                Avec attributs HTML
              </Button>
            </div>

            <div>
              <Label>style inline :</Label>
              <P style={{ fontStyle: 'italic', color: '#6366f1' }}>
                Paragraphe avec style inline personnalisé
              </P>
            </div>

            <div>
              <Label>onKeyDown :</Label>
              <Input
                placeholder="Appuyez sur Entrée..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') alert('Entrée pressée !')
                }}
              />
            </div>
          </Card.Body>
        </Card>
      </section>

      <div className="pb-8" />
    </div>
  )
}
