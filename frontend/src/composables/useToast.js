import Swal from "sweetalert2";

export function useToast() {
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true
  });

  function success(title) {
    return toast.fire({ icon: "success", title });
  }

  function error(title) {
    return toast.fire({ icon: "error", title });
  }

  return {
    success,
    error
  };
}
