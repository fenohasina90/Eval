import api, { Legacy } from "./api";

export async function getAllTickets(){
    let response = await api.get('/Assistance/Ticket')
    console.log(response)
    return response.data;
}

export async function deleteTicket(id){
    let response  = await api.delete('/Assistance/Ticket/'+id)
    return response
}

export async function deletePurgeTicket(id){
    let response  = await Legacy.delPurge('/Ticket/'+id)
    return response
}