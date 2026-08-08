import {
  getMyTicketsService,
  getTicketByIdService
} from '../services/ticket.service.js';

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await getMyTicketsService({
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {
        tickets
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const ticket = await getTicketByIdService({
      ticketId,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {
        ticket
      }
    });
  } catch (error) {
    next(error);
  }
};
