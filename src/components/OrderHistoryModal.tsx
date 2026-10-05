import React from 'react';
import { OrderPayload } from '../types/order';
import { COMMUNE_NAMES, SERVICES, formatFCFA, PHONE_DISPATCH_1 } from '../data/communes';
import { X, Clock, ArrowRight, MessageCircle, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  orders: OrderPayload[];
  onClose: () => void;
  onClearHistory: () => void;
  onReorder: (order: OrderPayload) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  orders,
  onClose,
  onClearHistory,
  onReorder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl text-[#0E1512] relative border border-[#DAD6CC] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DAD6CC]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E3F1E9] text-[#0B7A4B] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-lg text-[#0E1512]">Mes Commandes</h2>
              <p className="text-xs text-[#4B5751]">
                {orders.length} course{orders.length > 1 ? 's' : ''} enregistrée{orders.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-[#4B5751]">
              <Clock className="w-12 h-12 mx-auto text-[#DAD6CC] mb-2" />
              <p className="text-sm font-semibold">Aucune commande pour le moment</p>
              <p className="text-xs mt-1 text-[#4B5751]/80">
                Vos commandes passées apparaîtront ici pour un suivi ou un renouvellement rapide.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const svc = SERVICES.find((s) => s.id === order.svc) || SERVICES[0];
              const dateStr = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Récemment';

              const waUrl = `https://wa.me/${PHONE_DISPATCH_1}?text=${encodeURIComponent(
                `Bonjour TGV Livraison, je viens aux nouvelles pour ma commande réf. ${order.id}.`
              )}`;

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl border border-[#DAD6CC] bg-[#F6F4EF]/40 hover:bg-[#F6F4EF] transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-sora font-extrabold text-xs text-[#07401F]">
                        {order.id}
                      </span>
                      <span className="text-[10px] text-[#4B5751] block">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase bg-[#E3F1E9] text-[#0B7A4B] px-2 py-0.5 rounded-full">
                        {svc.name}
                      </span>
                      {order.tarif && (
                        <span className="text-xs font-extrabold text-[#07401F]">
                          {formatFCFA(order.tarif)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-[#0E1512] font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>{order.dep.q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#0B7A4B] flex-shrink-0" />
                      <span>{order.dst.q}</span>
                    </div>
                    {order.distance && (
                      <span className="text-[11px] text-[#4B5751] font-medium">
                        ~{order.distance} km
                      </span>
                    )}
                  </div>

                  {(order.recipientName || order.recipientPhone) && (
                    <div className="text-[11px] text-[#4B5751] flex items-center gap-1 font-medium">
                      <span>Destinataire :</span>
                      <span className="text-[#0E1512] font-semibold">{order.recipientName || 'Client'}</span>
                      {order.recipientPhone && <span>(+229 {order.recipientPhone})</span>}
                    </div>
                  )}

                  {order.note && (
                    <p className="text-[11px] text-[#4B5751] italic line-clamp-1">
                      « {order.note} »
                    </p>
                  )}

                  {/* Actions for this order */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        onReorder(order);
                        onClose();
                      }}
                      className="text-xs font-bold text-[#0B7A4B] hover:text-[#07401F] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Recommander ce trajet</span>
                    </button>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#4B5751] hover:text-[#07401F] flex items-center gap-1 hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#0B7A4B]" />
                      <span>Contacter le motard</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {orders.length > 0 && (
          <div className="pt-3 border-t border-[#DAD6CC] flex items-center justify-between">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Effacer l'historique</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="cta btn-ripple px-4 py-2 bg-[#0B7A4B] text-white text-xs font-bold rounded-xl hover:bg-[#07401F] transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
