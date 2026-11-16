/** The events module is retired. Project work is the only unit of delivery. */
export async function getAccessibleEvent(_eventId: string): Promise<{
  event: { id: string; name: string; teamIds: string[]; teams: Array<{ id: string; name: string }> };
}> {
  throw new Error("Events have been retired. Use projects.");
}
