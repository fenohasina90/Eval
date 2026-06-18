/**
 * Composants Table réutilisables
 * 
 * Table, Thead, Tbody, Tr, Th, Td
 * Chaque composant accepte tous les props natifs de son élément HTML
 * 
 * Exemple :
 *   <Table>
 *     <Thead>
 *       <Tr><Th>Nom</Th><Th>Age</Th></Tr>
 *     </Thead>
 *     <Tbody>
 *       <Tr><Td>Jean</Td><Td>25</Td></Tr>
 *     </Tbody>
 *   </Table>
 */

export function Table({ children, className = '', ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
      <table
        className={`w-full text-sm text-left ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function Thead({ children, className = '', ...props }) {
  return (
    <thead
      className={`bg-gray-50 border-b border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </thead>
  )
}

export function Tbody({ children, className = '', ...props }) {
  return (
    <tbody
      className={`divide-y divide-gray-100 ${className}`}
      {...props}
    >
      {children}
    </tbody>
  )
}

export function Tfoot({ children, className = '', ...props }) {
  return (
    <tfoot
      className={`divide-y divide-gray-100 ${className}`}
      {...props}
    >
      {children}
    </tfoot>
  )
}

export function Tr({ children, className = '', ...props }) {
  return (
    <tr
      className={`transition-colors duration-100 hover:bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

export function Th({ children, className = '', ...props }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({ children, className = '', ...props }) {
  return (
    <td
      className={`px-4 py-3 text-sm text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}
